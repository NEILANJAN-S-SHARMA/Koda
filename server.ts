import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import nodemailer from 'nodemailer';

interface FirebaseAppletConfig {
  apiKey?: string;
  projectId?: string;
}

interface VerifiedIdentity {
  uid: string;
  email: string;
  displayName?: string;
}

interface OtpRecord {
  uid: string;
  email: string;
  salt: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

type EmailProviderKind = 'resend' | 'gmail' | 'smtp' | 'none';

const PORT = Number(process.env.PORT || 3000);
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 10 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const otpStore = new Map<string, OtpRecord>();

function loadFirebaseApiKey(): string {
  try {
    const raw = fs.readFileSync(
      path.resolve(process.cwd(), 'firebase-applet-config.json'),
      'utf8'
    );
    const parsed = JSON.parse(raw) as FirebaseAppletConfig;
    return typeof parsed.apiKey === 'string' ? parsed.apiKey : '';
  } catch {
    return '';
  }
}

const FIREBASE_API_KEY = loadFirebaseApiKey();

function getConfiguredEmailProvider(): EmailProviderKind {
  if (process.env.RESEND_API_KEY?.trim()) return 'resend';
  if (process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim()) {
    return 'gmail';
  }
  if (
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim()
  ) {
    return 'smtp';
  }
  return 'none';
}

function maskEmailAddress(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0] ?? '*'}•@${domain}`;
  return `${local.slice(0, 2)}${'•'.repeat(Math.min(4, local.length - 2))}@${domain}`;
}

function hashOtpCode(code: string, salt: string): string {
  return crypto.createHash('sha256').update(`${salt}:${code}`).digest('hex');
}

function timingSafeHexEqual(aHex: string, bHex: string): boolean {
  const aBuf = Buffer.from(aHex, 'hex');
  const bBuf = Buffer.from(bHex, 'hex');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

async function verifyFirebaseIdToken(
  authHeader: string | undefined
): Promise<VerifiedIdentity | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken || !FIREBASE_API_KEY) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
        FIREBASE_API_KEY
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) return null;
    const data = (await res.json()) as {
      users?: Array<{ localId?: string; email?: string; displayName?: string }>;
    };
    const user = data.users?.[0];
    if (!user?.localId || !user?.email) return null;
    return {
      uid: user.localId,
      email: user.email,
      displayName: user.displayName,
    };
  } catch {
    return null;
  }
}

function buildOtpEmailContent(code: string, displayName?: string) {
  const greetingName = displayName?.trim() || 'Creator';
  const subject = `${code} is your Koda Studio verification code`;
  const text = [
    `Hi ${greetingName},`,
    '',
    `Your 4-digit Koda Studio verification code is: ${code}`,
    '',
    'This code expires in 10 minutes. If you did not try to sign in, you can safely ignore this email.',
  ].join('\n');

  const html = `
    <div style="background-color:#121B11;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#D4DAB4;">
      <div style="max-width:460px;margin:0 auto;background-color:#182217;border:1px solid #4A5F48;border-radius:16px;padding:28px;">
        <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9BB498;">Koda Studio · Session Verification</p>
        <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:600;color:#D4DAB4;">Verify your sign-in</h1>
        <p style="margin:0 0 22px 0;font-size:14px;line-height:1.5;color:#C7CFA3;">
          Hi ${greetingName.replace(/[<>&"]/g, '')}, enter this 4-digit verification code in Koda Studio to continue:
        </p>
        <div style="background-color:#233122;border:1px solid #789575;border-radius:12px;padding:18px;text-align:center;margin-bottom:20px;">
          <span style="font-family:'SFMono-Regular',Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:0.35em;color:#D4DAB4;">${code}</span>
        </div>
        <p style="margin:0;font-size:12px;line-height:1.5;color:#9BB498;">
          This code expires in 10 minutes. Never share it with anyone.
        </p>
      </div>
    </div>
  `;

  return { subject, text, html };
}

async function dispatchOtpEmail(params: {
  toEmail: string;
  code: string;
  displayName?: string;
}): Promise<{ delivered: boolean; provider: EmailProviderKind; errorMessage?: string }> {
  const provider = getConfiguredEmailProvider();
  if (provider === 'none') {
    return { delivered: false, provider: 'none' };
  }

  const { subject, text, html } = buildOtpEmailContent(params.code, params.displayName);

  if (provider === 'resend') {
    const apiKey = process.env.RESEND_API_KEY!.trim();
    const from =
      process.env.OTP_FROM_EMAIL?.trim() || 'Koda Studio <onboarding@resend.dev>';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.toEmail],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      return {
        delivered: false,
        provider: 'resend',
        errorMessage: `Resend rejected email delivery (${response.status}): ${errBody || response.statusText}`,
      };
    }

    return { delivered: true, provider: 'resend' };
  }

  const isGmail = provider === 'gmail';
  const host = isGmail ? 'smtp.gmail.com' : process.env.SMTP_HOST!.trim();
  const port = isGmail ? 465 : Number(process.env.SMTP_PORT || 587);
  const user = isGmail ? process.env.GMAIL_USER!.trim() : process.env.SMTP_USER!.trim();
  const pass = isGmail
    ? process.env.GMAIL_APP_PASSWORD!.trim()
    : process.env.SMTP_PASS!.trim();
  const from = process.env.OTP_FROM_EMAIL?.trim() || `Koda Studio <${user}>`;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from,
      to: params.toEmail,
      subject,
      text,
      html,
    });
    return { delivered: true, provider };
  } catch (err) {
    return {
      delivered: false,
      provider,
      errorMessage:
        err instanceof Error ? err.message : 'SMTP failed to deliver OTP email.',
    };
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    const provider = getConfiguredEmailProvider();
    res.json({
      status: 'ok',
      emailProvider: provider,
      emailConfigured: provider !== 'none',
    });
  });

  app.post('/api/otp/send', async (req: Request, res: Response) => {
    const identity = await verifyFirebaseIdToken(req.headers.authorization);
    if (!identity) {
      res.status(401).json({
        error: 'Unauthorized. Sign in again before requesting a verification code.',
      });
      return;
    }

    const now = Date.now();
    const existing = otpStore.get(identity.uid);
    if (
      existing &&
      existing.expiresAt > now &&
      now - existing.lastSentAt < OTP_RESEND_COOLDOWN_MS
    ) {
      const waitSec = Math.ceil(
        (OTP_RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000
      );
      res.status(429).json({
        error: `Please wait ${waitSec}s before requesting a new code.`,
      });
      return;
    }

    const code = String(crypto.randomInt(1000, 10000));
    const salt = crypto.randomBytes(16).toString('hex');
    const codeHash = hashOtpCode(code, salt);

    otpStore.set(identity.uid, {
      uid: identity.uid,
      email: identity.email,
      salt,
      codeHash,
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      lastSentAt: now,
    });

    const delivery = await dispatchOtpEmail({
      toEmail: identity.email,
      code,
      displayName: identity.displayName,
    });

    if (delivery.errorMessage) {
      res.status(502).json({
        error: delivery.errorMessage,
        provider: delivery.provider,
        delivered: false,
      });
      return;
    }

    if (delivery.delivered) {
      res.json({
        ok: true,
        delivered: true,
        provider: delivery.provider,
        maskedEmail: maskEmailAddress(identity.email),
        expiresInSeconds: OTP_TTL_MS / 1000,
      });
      return;
    }

    // Email provider secret not configured yet in server env:
    // return unconfigured notice with fallbackCode so auth testing is never deadlocked.
    res.json({
      ok: true,
      delivered: false,
      provider: 'none',
      maskedEmail: maskEmailAddress(identity.email),
      expiresInSeconds: OTP_TTL_MS / 1000,
      fallbackCode: code,
    });
  });

  app.post('/api/otp/verify', async (req: Request, res: Response) => {
    const identity = await verifyFirebaseIdToken(req.headers.authorization);
    if (!identity) {
      res.status(401).json({
        verified: false,
        error: 'Session expired. Please sign in again.',
      });
      return;
    }

    const rawCode =
      typeof req.body === 'object' && req.body !== null && 'code' in req.body
        ? String((req.body as { code?: unknown }).code ?? '').trim()
        : '';

    if (!/^\d{4}$/.test(rawCode)) {
      res.status(400).json({
        verified: false,
        error: 'Enter a valid 4-digit numeric code.',
      });
      return;
    }

    const record = otpStore.get(identity.uid);
    if (!record) {
      res.status(400).json({
        verified: false,
        error: 'No active verification code found. Click Resend code.',
      });
      return;
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(identity.uid);
      res.status(400).json({
        verified: false,
        error: 'That code expired. Request a fresh 4-digit code.',
      });
      return;
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      otpStore.delete(identity.uid);
      res.status(429).json({
        verified: false,
        error: 'Too many incorrect attempts. Request a new code.',
      });
      return;
    }

    const candidateHash = hashOtpCode(rawCode, record.salt);
    if (!timingSafeHexEqual(candidateHash, record.codeHash)) {
      record.attempts += 1;
      const remaining = OTP_MAX_ATTEMPTS - record.attempts;
      if (remaining <= 0) {
        otpStore.delete(identity.uid);
        res.status(429).json({
          verified: false,
          error: 'Too many incorrect attempts. Request a new code.',
        });
        return;
      }
      res.status(400).json({
        verified: false,
        error: `Incorrect 4-digit code. ${remaining} attempt${remaining === 1 ? '' : 's'} left.`,
      });
      return;
    }

    otpStore.delete(identity.uid);
    res.json({ verified: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Koda Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
