import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { auth, googleProvider } from '../../firebase';
import { syncUserProfile } from '../../services/firestoreService';
import { EmergeBlock } from '../shared/EmergeBlock';
import { OtpVerificationCard } from './OtpVerificationCard';

export type AuthMode = 'signin' | 'signup';

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  provider: 'password' | 'google';
}

interface AuthPageProps {
  initialMode?: AuthMode;
  onSuccess: (user: AuthUser) => void;
  onBackToHome: () => void;
}

const BLADE_EASE: [number, number, number, number] = [0.25, 0.08, 0.16, 1];
const EMERGE_EASE: [number, number, number, number] = [0.25, 0.08, 0.16, 1];

function mapFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : '';

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Enable Email/Password in Firebase Console (Authentication → Sign-in method) or use Continue with Google below.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6–8 characters long.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/unauthorized-domain':
      return 'Add this domain to Authorized Domains in Firebase Console → Authentication → Settings.';
    default: {
      if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message) as { error?: unknown };
          if (typeof parsed.error === 'string' && parsed.error) {
            return parsed.error;
          }
        } catch {
          // Not JSON-wrapped error
        }
        return error.message;
      }
      return 'Authentication failed. Please try again.';
    }
  }
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'signin',
  onSuccess,
  onBackToHome,
}) => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [visiblePane, setVisiblePane] = useState<AuthMode>(initialMode);
  const [isSweeping, setIsSweeping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOtpUser, setPendingOtpUser] = useState<AuthUser | null>(null);
  const swapTimerRef = useRef<number | null>(null);
  const doneTimerRef = useRef<number | null>(null);

  // Sign-up fields
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPass, setShowSignupPass] = useState(false);

  // Sign-in fields
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [showSigninPass, setShowSigninPass] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setVisiblePane(initialMode);
  }, [initialMode]);

  useEffect(() => {
    return () => {
      if (swapTimerRef.current) window.clearTimeout(swapTimerRef.current);
      if (doneTimerRef.current) window.clearTimeout(doneTimerRef.current);
    };
  }, []);

  const switchMode = (nextMode: AuthMode) => {
    if (nextMode === mode || isSweeping || isSubmitting) return;
    setErrorMsg(null);
    setStatusNotice(null);

    if (prefersReducedMotion) {
      setMode(nextMode);
      setVisiblePane(nextMode);
      return;
    }

    setIsSweeping(true);
    setMode(nextMode);

    if (swapTimerRef.current) window.clearTimeout(swapTimerRef.current);
    if (doneTimerRef.current) window.clearTimeout(doneTimerRef.current);

    swapTimerRef.current = window.setTimeout(() => {
      setVisiblePane(nextMode);
    }, 520);

    doneTimerRef.current = window.setTimeout(() => {
      setIsSweeping(false);
    }, 1250);
  };

  const passwordStrength = (() => {
    let score = 0;
    if (signupPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(signupPassword) && /[a-z]/.test(signupPassword)) score += 1;
    if (/[0-9]/.test(signupPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(signupPassword)) score += 1;
    return score;
  })();

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);
    setStatusNotice(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = signupEmail.trim();
    if (trimmedName.length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (signupPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, signupPassword);
      await updateProfile(cred.user, { displayName: trimmedName });
      void sendEmailVerification(cred.user).catch(() => {});

      await syncUserProfile({
        uid: cred.user.uid,
        displayName: trimmedName,
        email: trimmedEmail,
        authProvider: 'password',
      });

      setPendingOtpUser({
        uid: cred.user.uid,
        name: trimmedName,
        email: trimmedEmail,
        provider: 'password',
      });
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSigninSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);
    setStatusNotice(null);

    const trimmedEmail = signinEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (signinPassword.length < 6) {
      setErrorMsg('Enter your password (minimum 6 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      await setPersistence(
        auth,
        keepSignedIn ? browserLocalPersistence : browserSessionPersistence
      );
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, signinPassword);
      const displayName =
        cred.user.displayName?.trim() || trimmedEmail.split('@')[0] || 'Creator';

      await syncUserProfile({
        uid: cred.user.uid,
        displayName,
        email: cred.user.email || trimmedEmail,
        authProvider: 'password',
      });

      setPendingOtpUser({
        uid: cred.user.uid,
        name: displayName,
        email: cred.user.email || trimmedEmail,
        provider: 'password',
      });
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    setErrorMsg(null);
    setStatusNotice(null);
    setIsSubmitting(true);
    try {
      await setPersistence(
        auth,
        keepSignedIn ? browserLocalPersistence : browserSessionPersistence
      );
      const cred = await signInWithPopup(auth, googleProvider);
      const displayName =
        cred.user.displayName?.trim() ||
        cred.user.email?.split('@')[0] ||
        'Creator';
      const email = cred.user.email || `${cred.user.uid}@koda.studio`;

      await syncUserProfile({
        uid: cred.user.uid,
        displayName,
        email,
        authProvider: 'google',
      });

      setPendingOtpUser({
        uid: cred.user.uid,
        name: displayName,
        email,
        provider: 'google',
      });
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg(null);
    setStatusNotice(null);
    const trimmedEmail = signinEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Enter your email address above first, then click Forgot password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setStatusNotice(`Password reset link sent to ${trimmedEmail}.`);
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    }
  };

  const bladeTarget =
    mode === 'signup'
      ? {
          left: isSweeping ? ['54%', '-12%', '-10%'] : '-10%',
          width: isSweeping ? ['56%', '124%', '56%'] : '56%',
        }
      : {
          left: isSweeping ? ['-10%', '-12%', '54%'] : '54%',
          width: isSweeping ? ['56%', '124%', '56%'] : '56%',
        };

  return (
    <div
      className="h-screen h-[100dvh] w-full overflow-hidden flex flex-col px-4 sm:px-8 py-3 sm:py-4 text-[#D4DAB4]"
      style={{
        background:
          'radial-gradient(circle at 50% 22%, #314530 0%, #1C291B 55%, #121B11 100%)',
      }}
    >
      {/* Top minimal navigation bar — slow-motion emergence matching Hero/Studio */}
      <motion.header
        initial={
          prefersReducedMotion
            ? false
            : { opacity: 0, scale: 0.94, filter: 'blur(5px)' }
        }
        animate={{
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          transitionEnd: { filter: 'none', transform: 'none' },
        }}
        transition={{ duration: prefersReducedMotion ? 0.18 : 0.85, ease: EMERGE_EASE }}
        className="w-full max-w-[1160px] mx-auto flex items-center justify-between gap-4 shrink-0"
      >
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 text-xs font-medium text-[#C7CFA3] hover:text-[#D4DAB4] bg-[#2C3D2B]/70 hover:bg-[#3B5239] border border-[#789575]/45 rounded-md transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </button>

        <button
          type="button"
          onClick={onBackToHome}
          className="text-lg font-semibold tracking-tight text-[#D4DAB4] font-display"
        >
          Koda
        </button>
      </motion.header>

      {/* Center Stage: Skewed-Blade Auth Card or Orbital OTP Verification Card */}
      <main className="relative flex-1 min-h-0 w-full max-w-[820px] mx-auto flex items-center justify-center py-2">
        <AnimatePresence mode="wait" initial={false}>
          {pendingOtpUser ? (
            <motion.div
              key="otp-verification-step"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.91, filter: 'blur(10px)' }
              }
              transition={{ duration: prefersReducedMotion ? 0.18 : 0.65, ease: EMERGE_EASE }}
              className="w-full"
            >
              <OtpVerificationCard
                uid={pendingOtpUser.uid}
                email={pendingOtpUser.email}
                displayName={pendingOtpUser.name}
                authProvider={pendingOtpUser.provider}
                onVerified={() => onSuccess(pendingOtpUser)}
                onBack={() => {
                  void signOut(auth).catch(() => {});
                  setPendingOtpUser(null);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="credentials-auth-step"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.91, filter: 'blur(10px)' }
              }
              transition={{ duration: prefersReducedMotion ? 0.18 : 0.65, ease: EMERGE_EASE }}
              className="w-full max-h-full"
            >
              <EmergeBlock order={0} baseDelay={0.08} className="w-full max-h-full">
          <div className="relative w-full max-h-full rounded-2xl overflow-y-auto md:overflow-hidden bg-[#D4DAB4] text-[#192418] border border-[#789575]/60 shadow-[0_24px_60px_rgba(10,16,9,0.55)] md:h-[min(450px,calc(100dvh-70px))]">
            {/* MOBILE HEADER BLADE (< md) */}
            <div className="md:hidden relative bg-gradient-to-br from-[#192418] via-[#243623] to-[#2C3D2B] text-[#D4DAB4] px-5 pt-3 pb-4.5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          scale: 0.88,
                          y: 12,
                          rotateX: 5,
                          transformPerspective: 1150,
                          filter: 'blur(6px)',
                        }
                  }
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    rotateX: 0,
                    transformPerspective: 1150,
                    filter: 'blur(0px)',
                    transitionEnd: { filter: 'none', transform: 'none' },
                  }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.92, filter: 'blur(6px)' }
                  }
                  transition={{ duration: prefersReducedMotion ? 0.18 : 0.72, ease: EMERGE_EASE }}
                  className="space-y-0.5"
                >
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9BB498]">
                    Koda
                  </p>
                  <h2 className="text-lg font-semibold font-display tracking-tight">
                    {mode === 'signup' ? (
                      <>
                        Start the <span className="italic font-normal text-[#C7CFA3]">first cut.</span>
                      </>
                    ) : (
                      <>
                        Welcome <span className="italic font-normal text-[#C7CFA3]">back.</span>
                      </>
                    )}
                  </h2>
                  <p className="text-[11px] text-[#C7CFA3] leading-snug max-w-sm">
                    {mode === 'signup'
                      ? 'Encrypted Firebase accounts & studio project cloud sync.'
                      : 'Your encrypted studio projects are synced to Firebase.'}
                  </p>
                </motion.div>
              </AnimatePresence>
              {/* Diagonal bottom cut */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-3 h-6 bg-[#D4DAB4]"
                style={{ transform: 'skewY(-2.2deg)' }}
              />
            </div>

            {/* SIGN IN FORM PANE (Left 54% on desktop) */}
            <div
              className={`md:absolute md:inset-y-0 md:left-0 md:w-[54%] px-5 sm:px-9 py-4 sm:py-5 flex flex-col justify-center ${
                visiblePane === 'signin'
                  ? 'relative opacity-100 pointer-events-auto'
                  : 'hidden md:flex opacity-0 pointer-events-none'
              }`}
              aria-hidden={visiblePane !== 'signin'}
            >
              {visiblePane === 'signin' && (
                <form
                  key="signin-form-active"
                  onSubmit={handleSigninSubmit}
                  className="space-y-3 max-w-sm w-full mx-auto"
                >
                  <EmergeBlock order={0} baseDelay={0.08}>
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-[#192418] font-display">
                        Sign in
                      </h2>
                      <div className="w-7 h-[2px] bg-[#789575] mt-1 rounded-full" />
                    </div>
                  </EmergeBlock>

                  {errorMsg && visiblePane === 'signin' && (
                    <div className="flex items-start gap-2 text-[11px] leading-snug text-[#192418] bg-[#C7CFA3] border border-[#3B5239] rounded-md px-2.5 py-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[#3B5239] shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {statusNotice && visiblePane === 'signin' && (
                    <div className="text-[11px] leading-snug text-[#2C3D2B] bg-[#C7CFA3] border border-[#789575] rounded-md px-2.5 py-1.5">
                      {statusNotice}
                    </div>
                  )}

                  <EmergeBlock order={1} baseDelay={0.08}>
                    <div className="space-y-2.5">
                      <div>
                        <label
                          htmlFor="signin-email"
                          className="block text-[11px] font-medium text-[#3F523E] mb-0.5"
                        >
                          Email address
                        </label>
                        <div className="relative flex items-center border-b border-[#789575] focus-within:border-[#192418] transition-colors">
                          <input
                            id="signin-email"
                            type="email"
                            autoComplete="email"
                            value={signinEmail}
                            onChange={(e) => setSigninEmail(e.target.value)}
                            placeholder="creator@koda.studio"
                            className="w-full bg-transparent py-1 pr-8 text-sm text-[#192418] placeholder:text-[#557053]/80 focus:outline-none"
                          />
                          <Mail className="w-4 h-4 text-[#557053] shrink-0" />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="signin-password"
                          className="block text-[11px] font-medium text-[#3F523E] mb-0.5"
                        >
                          Password
                        </label>
                        <div className="relative flex items-center border-b border-[#789575] focus-within:border-[#192418] transition-colors">
                          <input
                            id="signin-password"
                            type={showSigninPass ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={signinPassword}
                            onChange={(e) => setSigninPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full bg-transparent py-1 pr-8 text-sm text-[#192418] placeholder:text-[#557053]/80 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSigninPass((prev) => !prev)}
                            aria-label={showSigninPass ? 'Hide password' : 'Show password'}
                            className="p-1 text-[#557053] hover:text-[#192418]"
                          >
                            {showSigninPass ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </EmergeBlock>

                  <EmergeBlock order={2} baseDelay={0.08} className="space-y-2.5">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setKeepSignedIn((prev) => !prev)}
                        className="inline-flex items-center gap-2 text-[#2C3D2B] hover:text-[#192418]"
                      >
                        <span
                          className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
                            keepSignedIn
                              ? 'bg-[#2C3D2B] border-[#2C3D2B] text-[#D4DAB4]'
                              : 'bg-transparent border-[#789575]'
                          }`}
                        >
                          {keepSignedIn && <Check className="w-3 h-3 stroke-[2.5]" />}
                        </span>
                        Keep me signed in
                      </button>

                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-[#3B5239] hover:text-[#192418] underline underline-offset-2 font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full min-h-[38px] py-2 px-5 rounded-full bg-[#2C3D2B] hover:bg-[#192418] disabled:opacity-60 text-[#D4DAB4] text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      Sign in
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleGoogleSignIn}
                      className="w-full min-h-[34px] py-1.5 px-4 rounded-full bg-[#C7CFA3] hover:bg-[#B9C493] disabled:opacity-60 border border-[#789575] text-[#192418] text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      Continue with Google
                    </button>

                    <p className="text-center text-xs text-[#3F523E]">
                      New to Koda?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('signup')}
                        className="font-semibold text-[#192418] underline underline-offset-2 hover:text-[#3B5239]"
                      >
                        Create an account
                      </button>
                    </p>
                  </EmergeBlock>
                </form>
              )}
            </div>

            {/* CREATE ACCOUNT FORM PANE (Right 54% on desktop) */}
            <div
              className={`md:absolute md:inset-y-0 md:right-0 md:w-[54%] px-5 sm:px-9 py-4 sm:py-5 flex flex-col justify-center ${
                visiblePane === 'signup'
                  ? 'relative opacity-100 pointer-events-auto'
                  : 'hidden md:flex opacity-0 pointer-events-none'
              }`}
              aria-hidden={visiblePane !== 'signup'}
            >
              {visiblePane === 'signup' && (
                <form
                  key="signup-form-active"
                  onSubmit={handleSignupSubmit}
                  className="space-y-2.5 max-w-sm w-full mx-auto"
                >
                  <EmergeBlock order={0} baseDelay={0.08}>
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-[#192418] font-display">
                        Create account
                      </h2>
                      <div className="w-7 h-[2px] bg-[#789575] mt-1 rounded-full" />
                    </div>
                  </EmergeBlock>

                  {errorMsg && visiblePane === 'signup' && (
                    <div className="flex items-start gap-2 text-[11px] leading-snug text-[#192418] bg-[#C7CFA3] border border-[#3B5239] rounded-md px-2.5 py-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[#3B5239] shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <EmergeBlock order={1} baseDelay={0.08}>
                    <div className="space-y-2">
                      <div>
                        <label
                          htmlFor="signup-name"
                          className="block text-[11px] font-medium text-[#3F523E] mb-0.5"
                        >
                          Full name
                        </label>
                        <div className="relative flex items-center border-b border-[#789575] focus-within:border-[#192418] transition-colors">
                          <input
                            id="signup-name"
                            type="text"
                            autoComplete="name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Alex Mercer"
                            className="w-full bg-transparent py-1 pr-8 text-sm text-[#192418] placeholder:text-[#557053]/80 focus:outline-none"
                          />
                          <User className="w-4 h-4 text-[#557053] shrink-0" />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="signup-email"
                          className="block text-[11px] font-medium text-[#3F523E] mb-0.5"
                        >
                          Email address
                        </label>
                        <div className="relative flex items-center border-b border-[#789575] focus-within:border-[#192418] transition-colors">
                          <input
                            id="signup-email"
                            type="email"
                            autoComplete="email"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            placeholder="alex@studio.io"
                            className="w-full bg-transparent py-1 pr-8 text-sm text-[#192418] placeholder:text-[#557053]/80 focus:outline-none"
                          />
                          <Mail className="w-4 h-4 text-[#557053] shrink-0" />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="signup-password"
                          className="block text-[11px] font-medium text-[#3F523E] mb-0.5"
                        >
                          Password
                        </label>
                        <div className="relative flex items-center border-b border-[#789575] focus-within:border-[#192418] transition-colors">
                          <input
                            id="signup-password"
                            type={showSignupPass ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="Create a password"
                            className="w-full bg-transparent py-1 pr-8 text-sm text-[#192418] placeholder:text-[#557053]/80 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPass((prev) => !prev)}
                            aria-label={showSignupPass ? 'Hide password' : 'Show password'}
                            className="p-1 text-[#557053] hover:text-[#192418]"
                          >
                            {showSignupPass ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* 4-segment strength indicator */}
                        <div className="mt-1.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 flex-1">
                            {[0, 1, 2, 3].map((idx) => (
                              <span
                                key={idx}
                                className={`h-[3px] flex-1 rounded-full transition-colors ${
                                  idx < passwordStrength ? 'bg-[#3B5239]' : 'bg-[#789575]/35'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-[#3F523E] shrink-0">
                            Use 8 characters or more.
                          </span>
                        </div>
                      </div>
                    </div>
                  </EmergeBlock>

                  <EmergeBlock order={2} baseDelay={0.08} className="space-y-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full min-h-[38px] py-2 px-5 rounded-full bg-[#2C3D2B] hover:bg-[#192418] disabled:opacity-60 text-[#D4DAB4] text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9BB498]" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-[#9BB498]" />
                      )}
                      Create account
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleGoogleSignIn}
                      className="w-full min-h-[34px] py-1.5 px-4 rounded-full bg-[#C7CFA3] hover:bg-[#B9C493] disabled:opacity-60 border border-[#789575] text-[#192418] text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      Continue with Google
                    </button>

                    <p className="text-center text-xs text-[#3F523E]">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('signin')}
                        className="font-semibold text-[#192418] underline underline-offset-2 hover:text-[#3B5239]"
                      >
                        Sign in
                      </button>
                    </p>
                  </EmergeBlock>
                </form>
              )}
            </div>

            {/* DESKTOP SKEWED SWEEPING DIAGONAL BLADE */}
            <motion.div
              aria-hidden="true"
              initial={false}
              animate={{ ...bladeTarget, skewX: 8 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 1.25,
                times: [0, 0.45, 1],
                ease: BLADE_EASE,
              }}
              style={{ skewX: 8 }}
              className="hidden md:block absolute inset-y-[-10%] z-20 pointer-events-none bg-gradient-to-br from-[#162015] via-[#223321] to-[#2C3D2B] shadow-[0_0_60px_rgba(10,16,9,0.6)] overflow-hidden will-change-transform"
            >
              {/* Soft radial highlight inside the skewed forest-sage blade */}
              <div
                className="absolute inset-0 opacity-75"
                style={{
                  background:
                    'radial-gradient(circle at 38% 32%, rgba(120, 149, 117, 0.28), transparent 65%)',
                }}
              />
              {/* Lit leading & trailing seams along the diagonal blade edges */}
              <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-transparent via-[#C5D1B8]/55 to-transparent" />
              <div className="absolute inset-y-0 right-0 w-[2px] bg-gradient-to-b from-transparent via-[#C5D1B8]/55 to-transparent" />
            </motion.div>

            {/* DESKTOP UPRIGHT BLADE EDITORIAL COPY (z-30 over the blade) */}
            <div
              className={`hidden md:flex absolute inset-y-0 z-30 w-[42%] px-8 py-6 flex-col justify-center pointer-events-none transition-all ${
                mode === 'signup' ? 'left-0' : 'right-0'
              }`}
            >
              <AnimatePresence mode="wait">
                {!isSweeping && (
                  <motion.div
                    key={mode}
                    initial={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : {
                            opacity: 0,
                            scale: 0.86,
                            y: 16,
                            rotateX: 5,
                            transformPerspective: 1150,
                            filter: 'blur(6px)',
                          }
                    }
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      rotateX: 0,
                      transformPerspective: 1150,
                      filter: 'blur(0px)',
                      transitionEnd: { filter: 'none', transform: 'none' },
                    }}
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.9, filter: 'blur(6px)' }
                    }
                    transition={{ duration: prefersReducedMotion ? 0.18 : 0.85, ease: EMERGE_EASE }}
                    className="space-y-2.5 text-[#D4DAB4]"
                  >
                    <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#9BB498]">
                      Koda
                    </p>
                    <h2 className="text-3xl font-semibold tracking-tight leading-[1.1] font-display text-[#D4DAB4]">
                      {mode === 'signup' ? (
                        <>
                          Start the
                          <br />
                          <span className="italic font-normal text-[#C7CFA3]">first cut.</span>
                        </>
                      ) : (
                        <>
                          Welcome
                          <br />
                          <span className="italic font-normal text-[#C7CFA3]">back.</span>
                        </>
                      )}
                    </h2>
                    <p className="text-xs sm:text-[13px] text-[#C7CFA3] leading-relaxed max-w-[230px]">
                      {mode === 'signup'
                        ? 'Encrypted Firebase accounts & studio project cloud sync.'
                        : 'Your encrypted studio projects are synced to Firebase.'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
              </EmergeBlock>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
