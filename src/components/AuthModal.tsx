import React, { useState } from 'react';
import { Modal, Button, Input } from './ui/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from './ui/Toast.tsx';
import { LogIn, UserPlus, KeyRound, Mail, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithEmail, signUpWithEmail, verifyOtp, resendVerificationOtp, isConfigured } = useAuth();
  const { success, error: toastError } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      if (mode === 'signin') {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        success('Welcome back!', 'Signed into StatusHired');
        onClose();
      } else {
        const { error, data } = await signUpWithEmail(email, password);
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        if (data?.user && !data?.session) {
          setIsVerifyingOtp(true);
          success('Code sent!', 'Please enter the 6-digit confirmation code sent to your email.');
        } else {
          success('Welcome!', 'Account created successfully');
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      const { error } = await verifyOtp(email, otpCode);
      if (error) {
        setErrorMsg(error.message || 'Verification failed');
      } else {
        success('Verified!', 'Your email has been confirmed and account activated.');
        setIsVerifyingOtp(false);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    try {
      setIsLoading(true);
      const { error } = await resendVerificationOtp(email);
      if (error) {
        setErrorMsg(error.message);
      } else {
        success('Code resent!', 'Check your inbox for a new security code.');
        setResendCooldown(45);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {isVerifyingOtp ? (
            <KeyRound className="w-5 h-5 text-indigo-500" />
          ) : mode === 'signin' ? (
            <LogIn className="w-5 h-5 text-indigo-500" />
          ) : (
            <UserPlus className="w-5 h-5 text-violet-500" />
          )}
          <span>
            {isVerifyingOtp
              ? 'Verify Security Code'
              : mode === 'signin'
              ? 'Sign In to StatusHired'
              : 'Create an Account'}
          </span>
        </div>
      }
      description={
        isVerifyingOtp
          ? `Enter the 6-digit confirmation code sent to ${email}. Required once on sign-up.`
          : isConfigured
          ? 'Secure cookie-based session with Supabase Postgres & Storage'
          : 'Supabase cloud authentication required'
      }
      maxWidth="sm"
    >
      {isVerifyingOtp ? (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <Input
            label="Confirmation Code (OTP)"
            type="text"
            placeholder="123456"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            leftIcon={<KeyRound className="w-4 h-4" />}
            required
            autoFocus
          />

          {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}

          <Button
            variant="primary"
            type="submit"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            Verify &amp; Continue
          </Button>

          <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setIsVerifyingOtp(false)}
              className="hover:underline"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isLoading}
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline disabled:opacity-50"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
            autoFocus
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<KeyRound className="w-4 h-4" />}
            required
          />

          {errorMsg && (
            <p className="text-xs text-rose-500">{errorMsg}</p>
          )}

          <Button
            variant="primary"
            type="submit"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            {mode === 'signin' ? 'Sign In' : 'Sign Up & Verify'}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setErrorMsg(null);
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {mode === 'signin'
                ? "Don't have an account yet? Create one"
                : 'Already have an account? Sign In'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
