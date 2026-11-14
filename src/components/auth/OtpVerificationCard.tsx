import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Loader2,
  MailCheck,
  MessageSquare,
  RotateCw,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { auth } from '../../firebase';
import { recordOtpVerification } from '../../services/firestoreService';
import { EmergeBlock } from '../shared/EmergeBlock';

interface OtpVerificationCardProps {
  uid: string;
  email: string;
  displayName?: string;
  authProvider?: 'password' | 'google';
  onVerified: () => void;
  onBack: () => void;
}

type VerdictState = 'idle' | 'orbiting' | 'verified' | 'error';

interface SendOtpResponse {
  ok?: boolean;
  delivered?: boolean;
  provider?: 'resend' | 'gmail' | 'smtp' | 'none';
  maskedEmail?: string;
  fallbackCode?: string;
  error?: string;
}

interface VerifyOtpResponse {
  verified?: boolean;
  error?: string;
}

const EMERGE_EASE: [number, number, number, number] = [0.25, 0.08, 0.16, 1];
const WIND_UP_BRAKE = 'cubic-bezier(0.32, 0.04, 0.14, 1)';

function maskEmailAddress(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0] ?? '*'}•@${domain}`;
  return `${local.slice(0, 2)}${'•'.repeat(Math.min(4, local.length - 2))}@${domain}`;
}

export const OtpVerificationCard: React.FC<OtpVerificationCardProps> = ({
  uid,
  email,
  displayName,
  authProvider,
  onVerified,
  onBack,
}) => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [focusedIdx, setFocusedIdx] = useState<number>(0);
  const [verdict, setVerdict] = useState<VerdictState>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);

  const [isSending, setIsSending] = useState<boolean>(true);
  const [emailDelivered, setEmailDelivered] = useState<boolean>(false);
  const [deliveryProvider, setDeliveryProvider] = useState<string>('none');
  const [fallbackCode, setFallbackCode] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState<string>('Sending 4-digit code to your inbox...');

  const hubRef = useRef<HTMLSpanElement | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timersRef = useRef<number[]>([]);
  const initialSendTriggeredRef = useRef<boolean>(false);

  const maskedContact = useMemo(() => maskEmailAddress(email), [email]);

  const clearScheduledTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const requestOtpDispatch = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setIsSending(false);
      setErrorText('Session expired. Please sign in again.');
      return;
    }

    setIsSending(true);
    setErrorText(null);
    setStatusLine('Sending 4-digit code to your inbox...');

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = (await res.json().catch(() => ({}))) as SendOtpResponse;

      if (!res.ok) {
        setEmailDelivered(false);
        setFallbackCode(null);
        setStatusLine('Could not send OTP email.');
        setErrorText(data.error || 'Failed to dispatch verification email.');
        return;
      }

      if (data.delivered) {
        setEmailDelivered(true);
        setDeliveryProvider(data.provider ?? 'email');
        setFallbackCode(null);
        setStatusLine(`4-digit code emailed to ${data.maskedEmail || maskedContact}.`);
      } else {
        setEmailDelivered(false);
        setDeliveryProvider('none');
        setFallbackCode(data.fallbackCode ?? null);
        setStatusLine('Add RESEND_API_KEY or GMAIL_USER + GMAIL_APP_PASSWORD in Secrets for live inbox delivery.');
      }
    } catch {
      setEmailDelivered(false);
      setFallbackCode(null);
      setStatusLine('Email server unreachable.');
      setErrorText('Network error while contacting the OTP delivery server.');
    } finally {
      setIsSending(false);
      const focusTimer = window.setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 180);
      timersRef.current.push(focusTimer);
    }
  }, [maskedContact]);

  useEffect(() => {
    if (!initialSendTriggeredRef.current) {
      initialSendTriggeredRef.current = true;
      void requestOtpDispatch();
    }
    return () => {
      clearScheduledTimers();
    };
  }, [requestOtpDispatch]);

  const restoreSlotsOnError = (message: string) => {
    slotRefs.current.forEach((slotEl) => {
      if (!slotEl) return;
      slotEl.getAnimations?.().forEach((anim) => anim.cancel());
      slotEl.style.transformOrigin = '';
    });
    setVerdict('error');
    setErrorText(message);
    const resetTimer = window.setTimeout(() => {
      setDigits(['', '', '', '']);
      setVerdict('idle');
      setFocusedIdx(0);
      inputRefs.current[0]?.focus();
    }, 560);
    timersRef.current.push(resetTimer);
  };

  const triggerOrbitalVerification = (submittedDigits: string[]) => {
    const entered = submittedDigits.join('');
    if (entered.length !== 4 || verdict === 'orbiting' || verdict === 'verified') return;

    setErrorText(null);
    setVerdict('orbiting');

    // Run exact orbital collapse around the center hub using Web Animations API
    const hubEl = hubRef.current;
    if (!prefersReducedMotion && hubEl) {
      const hubRect = hubEl.getBoundingClientRect();
      const hubCx = hubRect.left + hubRect.width / 2;
      const hubCy = hubRect.top + hubRect.height / 2;

      slotRefs.current.forEach((slotEl, index) => {
        if (!slotEl || typeof slotEl.animate !== 'function') return;
        const slotRect = slotEl.getBoundingClientRect();
        const originX = hubCx - slotRect.left;
        const originY = hubCy - slotRect.top;

        slotEl.style.transformOrigin = `${originX}px ${originY}px`;
        slotEl.animate(
          [
            {
              transform: 'rotate(0deg) scale(1)',
              opacity: 1,
            },
            {
              transform: `rotate(${420 + index * 24}deg) scale(0.08)`,
              opacity: 0.05,
            },
          ],
          {
            duration: 800,
            easing: WIND_UP_BRAKE,
            fill: 'forwards',
          }
        );
      });
    }

    const animDelay = prefersReducedMotion ? 180 : 620;
    const verifyTimer = window.setTimeout(async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        restoreSlotsOnError('Session expired. Please sign in again.');
        return;
      }

      try {
        const idToken = await currentUser.getIdToken();
        const res = await fetch('/api/otp/verify', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: entered }),
        });
        const data = (await res.json().catch(() => ({}))) as VerifyOtpResponse;

        if (!res.ok || !data.verified) {
          restoreSlotsOnError(data.error || 'Incorrect 4-digit code. Try again.');
          return;
        }

        setVerdict('verified');
        try {
          await recordOtpVerification({
            uid,
            displayName,
            email,
            authProvider,
          });
        } catch (err) {
          console.error('Failed to log verification timestamp:', err);
        }

        const finishTimer = window.setTimeout(() => {
          onVerified();
        }, prefersReducedMotion ? 220 : 650);
        timersRef.current.push(finishTimer);
      } catch {
        restoreSlotsOnError('Verification server unreachable. Please try again.');
      }
    }, animDelay);

    timersRef.current.push(verifyTimer);
  };

  const handleDigitChange = (index: number, rawValue: string) => {
    if (verdict === 'orbiting' || verdict === 'verified') return;
    setErrorText(null);
    if (verdict === 'error') setVerdict('idle');

    const cleaned = rawValue.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 4).split('');
      const next = ['', '', '', ''];
      chars.forEach((ch, idx) => {
        next[idx] = ch;
      });
      setDigits(next);
      const nextFocus = Math.min(chars.length, 3);
      setFocusedIdx(nextFocus);
      inputRefs.current[nextFocus]?.focus();
      if (next.every((d) => d !== '')) {
        triggerOrbitalVerification(next);
      }
      return;
    }

    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);

    if (index < 3) {
      setFocusedIdx(index + 1);
      inputRefs.current[index + 1]?.focus();
    } else if (next.every((d) => d !== '')) {
      inputRefs.current[index]?.blur();
      triggerOrbitalVerification(next);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (verdict === 'orbiting' || verdict === 'verified') return;

    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        setFocusedIdx(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      setFocusedIdx(index - 1);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      e.preventDefault();
      setFocusedIdx(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (verdict === 'orbiting' || verdict === 'verified') return;
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    e.preventDefault();
    const next = ['', '', '', ''];
    pasted.split('').forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    if (pasted.length === 4) {
      triggerOrbitalVerification(next);
    } else {
      const nextIdx = Math.min(pasted.length, 3);
      setFocusedIdx(nextIdx);
      inputRefs.current[nextIdx]?.focus();
    }
  };

  const handleFillClick = () => {
    if (!fallbackCode || verdict === 'orbiting' || verdict === 'verified') return;
    clearScheduledTimers();
    setErrorText(null);
    setVerdict('idle');

    const codeChars = fallbackCode.split('');
    if (prefersReducedMotion) {
      setDigits(codeChars);
      triggerOrbitalVerification(codeChars);
      return;
    }

    setDigits(['', '', '', '']);
    codeChars.forEach((char, idx) => {
      const stepTimer = window.setTimeout(() => {
        setDigits((prev) => {
          const next = [...prev];
          next[idx] = char;
          return next;
        });
        setFocusedIdx(idx);
        if (idx === 3) {
          const runTimer = window.setTimeout(() => {
            triggerOrbitalVerification(codeChars);
          }, 110);
          timersRef.current.push(runTimer);
        }
      }, idx * 70);
      timersRef.current.push(stepTimer);
    });
  };

  const handleResend = () => {
    if (verdict === 'orbiting' || verdict === 'verified' || isSending) return;
    clearScheduledTimers();
    slotRefs.current.forEach((slotEl) => {
      slotEl?.getAnimations?.().forEach((anim) => anim.cancel());
      if (slotEl) slotEl.style.transformOrigin = '';
    });
    setDigits(['', '', '', '']);
    setVerdict('idle');
    setFocusedIdx(0);
    void requestOtpDispatch();
  };

  return (
    <EmergeBlock order={0} baseDelay={0.08} className="w-full max-w-[440px] mx-auto">
      <div
        className="relative w-full rounded-2xl border border-[#789575]/45 bg-[#182217]/95 text-[#D4DAB4] shadow-[0_28px_70px_rgba(8,14,8,0.65)] px-6 sm:px-8 pt-4 pb-6 flex flex-col items-center gap-4 overflow-hidden"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(120, 149, 117, 0.16), transparent 60%)',
        }}
      >
        <div className="w-8 h-1 rounded-full bg-[#789575]/40" aria-hidden="true" />

        {/* Header */}
        <EmergeBlock order={1} baseDelay={0.08} className="text-center space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight font-display text-[#D4DAB4]">
            Check your inbox
          </h2>
          <p className="text-xs sm:text-[13px] text-[#B8C6AA] leading-relaxed">
            {emailDelivered ? (
              <>
                Enter the 4-digit code sent to{' '}
                <span className="font-mono font-semibold text-[#D4DAB4]">
                  {maskedContact}
                </span>
              </>
            ) : (
              <>
                Enter the 4-digit verification code for{' '}
                <span className="font-mono font-semibold text-[#D4DAB4]">
                  {maskedContact}
                </span>
              </>
            )}
          </p>
        </EmergeBlock>

        {/* Orbital Stage + 4 Digit Slots */}
        <EmergeBlock order={2} baseDelay={0.08} className="w-full">
          <motion.div
            animate={
              verdict === 'error' && !prefersReducedMotion
                ? { x: [0, -8, 8, -5, 5, 0] }
                : { x: 0 }
            }
            transition={{ duration: 0.36, ease: 'easeInOut' }}
            className="relative flex items-center justify-center py-5"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <motion.svg
                viewBox="0 0 120 120"
                className="w-28 h-28"
                initial={false}
                animate={
                  verdict === 'orbiting'
                    ? { opacity: 0.9, scale: 1, rotate: 180 }
                    : verdict === 'verified'
                      ? { opacity: 1, scale: 1.08, rotate: 240 }
                      : { opacity: 0.28, scale: 0.88, rotate: 0 }
                }
                transition={{ duration: 0.85, ease: EMERGE_EASE }}
              >
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={
                    verdict === 'verified'
                      ? '#7DE081'
                      : verdict === 'error'
                        ? '#F28B82'
                        : '#D4DAB4'
                  }
                  strokeWidth="1.5"
                  strokeDasharray="2 8"
                  vectorEffect="non-scaling-stroke"
                />
              </motion.svg>

              <motion.span
                ref={hubRef}
                initial={false}
                animate={
                  verdict === 'verified'
                    ? {
                        scale: 1,
                        opacity: 1,
                        backgroundColor: '#7DE081',
                        boxShadow: '0 0 26px rgba(125, 224, 129, 0.7)',
                      }
                    : verdict === 'orbiting'
                      ? {
                          scale: 0.72,
                          opacity: 1,
                          backgroundColor: '#D4DAB4',
                          boxShadow: '0 0 20px rgba(212, 218, 180, 0.65)',
                        }
                      : {
                          scale: 0.25,
                          opacity: 0,
                          backgroundColor: '#D4DAB4',
                          boxShadow: '0 0 0px rgba(212, 218, 180, 0)',
                        }
                }
                transition={{ duration: 0.35, ease: EMERGE_EASE }}
                className="absolute w-10 h-10 rounded-full flex items-center justify-center text-[#131C12]"
              >
                {verdict === 'verified' ? <Check className="w-5 h-5 stroke-[2.75]" /> : null}
              </motion.span>
            </div>

            <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-3.5">
              {digits.map((digit, index) => {
                const isActive = focusedIdx === index && verdict === 'idle';
                return (
                  <div
                    key={index}
                    ref={(el) => {
                      slotRefs.current[index] = el;
                    }}
                    className={`relative w-12 h-14 sm:w-14 sm:h-16 rounded-xl border transition-all duration-150 flex items-center justify-center bg-[#233122]/90 shadow-inner ${
                      verdict === 'error'
                        ? 'border-[#F28B82] shadow-[0_0_0_2px_rgba(242,139,130,0.22)]'
                        : isActive
                          ? 'border-[#D4DAB4] shadow-[0_0_0_2px_rgba(212,218,180,0.24)]'
                          : digit
                            ? 'border-[#9BB498]/70'
                            : 'border-[#789575]/40'
                    }`}
                  >
                    <input
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      aria-label={`Verification code digit ${index + 1}`}
                      value={digit}
                      disabled={verdict === 'orbiting' || verdict === 'verified' || isSending}
                      onFocus={() => setFocusedIdx(index)}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-full h-full bg-transparent text-center text-xl sm:text-2xl font-semibold font-mono tabular-nums text-[#D4DAB4] focus:outline-none caret-[#D4DAB4]"
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        </EmergeBlock>

        {/* Verdict / Action links */}
        <div className="min-h-[20px] text-center space-y-1.5">
          {verdict === 'verified' ? (
            <p className="text-xs font-semibold text-[#8CE08A]">
              Verified — entering Koda Studio...
            </p>
          ) : verdict === 'orbiting' ? (
            <p className="text-xs text-[#C7CFA3]">Verifying 4-digit code...</p>
          ) : errorText ? (
            <p className="text-xs text-[#F28B82]">{errorText}</p>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-[#9BB498]">
              <button
                type="button"
                disabled={isSending}
                onClick={handleResend}
                className="inline-flex items-center gap-1 hover:text-[#D4DAB4] disabled:opacity-50 transition-colors"
              >
                {isSending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCw className="w-3 h-3" />
                )}
                Resend code
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 hover:text-[#D4DAB4] transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Switch account
              </button>
            </div>
          )}
        </div>

        {/* Bottom Delivery Status or Fallback Banner */}
        <EmergeBlock order={3} baseDelay={0.08} className="w-full">
          {emailDelivered ? (
            <div className="w-full rounded-xl bg-[#111910]/95 border border-[#789575]/45 px-3.5 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#243423] border border-[#789575]/45 flex items-center justify-center shrink-0 text-[#8CE08A]">
                <MailCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#9BB498]">
                  Email Sent · {deliveryProvider.toUpperCase()}
                </p>
                <p className="text-xs text-[#C7CFA3] truncate">{statusLine}</p>
              </div>
            </div>
          ) : (
            <div className="w-full rounded-xl bg-[#111910]/95 border border-[#789575]/40 px-3.5 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#243423] border border-[#789575]/45 flex items-center justify-center shrink-0 text-[#C5D1B8]">
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#9BB498]">
                    {isSending ? 'Dispatching Email...' : 'Fallback Preview · Mail Secret Needed'}
                  </p>
                  <p className="text-[11px] text-[#C7CFA3] truncate">
                    {fallbackCode ? (
                      <>
                        Code{' '}
                        <span className="font-mono font-bold text-[#D4DAB4] tabular-nums">
                          {fallbackCode}
                        </span>{' '}
                        — add Gmail/Resend secret to email directly.
                      </>
                    ) : (
                      statusLine
                    )}
                  </p>
                </div>
              </div>

              {fallbackCode ? (
                <button
                  type="button"
                  disabled={verdict === 'orbiting' || verdict === 'verified'}
                  onClick={handleFillClick}
                  className="px-3.5 py-1.5 rounded-full bg-[#D4DAB4] hover:bg-[#C7CFA3] disabled:opacity-50 text-[#192418] text-xs font-semibold transition-colors shrink-0"
                >
                  Fill
                </button>
              ) : null}
            </div>
          )}
        </EmergeBlock>
      </div>
    </EmergeBlock>
  );
};
