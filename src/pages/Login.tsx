import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Database,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShieldCheck,
  KeyRound,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { DatabaseSetupModal } from '../components/DatabaseSetupModal.tsx';
import { StatusHiredLogo } from '../components/ui/StatusHiredLogo.tsx';
import { BiometricEnrollmentModal } from '../components/BiometricEnrollmentModal.tsx';
import { isPlatformBiometricsAvailable, getBiometricEnrollment } from '../lib/biometrics.ts';

export const Login: React.FC = () => {
  useDocumentTitle('Sign In');
  const { user, isConfigured, signInWithEmail, signUpWithEmail, verifyOtp, resendVerificationOtp } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; otp?: string; general?: string }>({});

  // One-time Security Sign-Up Step states
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Optional one-time biometric prompt for newly registered user
  const [pendingBiometricUser, setPendingBiometricUser] = useState<{ id: string; email: string } | null>(null);

  const [showKeyInstructions, setShowKeyInstructions] = useState(false);
  const [isDbSetupModalOpen, setIsDbSetupModalOpen] = useState(false);

  // If user is authenticated and not waiting for the biometric step, redirect to app
  if (user && !pendingBiometricUser) {
    return <Navigate to="/" replace />;
  }

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const checkAndOfferBiometrics = async (userId: string, userEmail: string) => {
    try {
      const supported = await isPlatformBiometricsAvailable();
      const existing = getBiometricEnrollment(userId);
      if (supported && !existing.isEnrolled) {
        setPendingBiometricUser({ id: userId, email: userEmail });
      }
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (mode === 'signin') {
        const { error } = await signInWithEmail(email.trim(), password);
        if (error) {
          const msg = error.message.toLowerCase().includes('invalid')
            ? 'Incorrect email or password. Please try again.'
            : error.message;
          setErrors({ general: msg });
        }
      } else {
        // Sign-up flow: Initiates one-time security verification
        const { error, data } = await signUpWithEmail(email.trim(), password);
        if (error) {
          setErrors({ general: error.message });
        } else if (data?.user) {
          if (!data.session) {
            // Email confirmation / OTP verification is required
            setIsVerifyingOtp(true);
          } else {
            // Direct sign-in allowed by project, check if we can offer one-time biometrics
            await checkAndOfferBiometrics(data.user.id, email.trim());
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      setErrors({ otp: 'Please enter the 6-digit confirmation code.' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const { data, error } = await verifyOtp(email.trim(), cleanOtp);
      if (error) {
        setErrors({ otp: error.message || 'Invalid or expired confirmation code.' });
      } else if (data?.user) {
        setIsVerifyingOtp(false);
        await checkAndOfferBiometrics(data.user.id, email.trim());
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setIsLoading(true);
    setResendSuccess(false);
    setErrors({});

    try {
      const { error } = await resendVerificationOtp(email.trim());
      if (error) {
        setErrors({ otp: error.message });
      } else {
        setResendSuccess(true);
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

  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setErrors({});
    setIsVerifyingOtp(false);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col justify-center items-center px-4 py-12 transition-colors">
      <div className="w-full max-w-[420px] flex flex-col items-center">
        {/* Top App Branding */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="mb-3.5">
            <StatusHiredLogo size={56} />
          </div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
            Status<span className="text-[#0A84FF]">Hired</span>
          </h1>
          <p className="text-[15px] text-[#86868B] dark:text-[#8E8E93] mt-1">
            Every application. One calm place to get hired.
          </p>
        </div>

        {/* Supabase Status Banner */}
        <div className="w-full mb-4 p-4 rounded-[20px] bg-white dark:bg-[#1C1C1E] shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border dark:border-[#38383A] transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConfigured ? 'bg-[#30D158] animate-pulse' : 'bg-[#FF9F0A]'
                }`}
              />
              <span className="text-[13px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {isConfigured ? 'Supabase Live Connected' : 'Supabase Not Configured'}
              </span>
            </div>
            {!isConfigured && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDbSetupModalOpen(true)}
                  className="text-[12px] text-[#0A84FF] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Where to find keys?
                </button>
                <span className="text-[#86868B] text-[12px]">•</span>
                <button
                  type="button"
                  onClick={() => setShowKeyInstructions(!showKeyInstructions)}
                  className="text-[12px] text-[#0A84FF] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Quick steps {showKeyInstructions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {showKeyInstructions && !isConfigured && (
            <div className="mt-4 pt-3 border-t border-[#E5E5EA] dark:border-[#38383A] text-[12px] text-[#86868B] dark:text-[#8E8E93] space-y-2">
              <p className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                To connect your live Supabase cloud database:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>Create a free project at <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-[#0A84FF] hover:underline">supabase.com</a></li>
                <li><strong>Project URL</strong>: Check your browser address bar: <code className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-1 py-0.5 rounded font-mono">https://[your-id].supabase.co</code> (or click the top "Connect" button)</li>
                <li><strong>API Key</strong>: Copy your <strong>Publishable key</strong> (<code className="font-mono">sb_publishable_...</code>) or <strong>Legacy anon key</strong></li>
                <li>Open your local <code className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-1 py-0.5 rounded font-mono">.env</code> file in Notepad and replace the placeholder values</li>
                <li>Run <code className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-1 py-0.5 rounded font-mono">supabase/schema.sql</code> in Supabase SQL Editor</li>
                <li>Restart <code className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-1 py-0.5 rounded font-mono">start-windows.bat</code></li>
              </ol>
              <button
                type="button"
                onClick={() => setIsDbSetupModalOpen(true)}
                className="w-full mt-2 py-1.5 px-3 rounded-[10px] bg-[#0A84FF]/10 text-[#0A84FF] text-xs font-medium hover:bg-[#0A84FF]/15 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                Open Full Setup &amp; Schema Guide
              </button>
            </div>
          )}
        </div>

        {/* Form Card */}
        <div className="w-full bg-white dark:bg-[#1C1C1E] rounded-[22px] p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border dark:border-[#38383A] transition-colors">
          {isVerifyingOtp ? (
            /* Option 1: One-Time Email Verification (OTP Code / Confirmation) */
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center mx-auto mb-1">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Verify Your Email
                </h3>
                <p className="text-[13.5px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                  We sent a 6-digit one-time security code to <strong className="text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold">{email}</strong>. This is only required once during sign-up.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#86868B] dark:text-[#8E8E93] block">
                    Security Code (OTP)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={10}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full h-12 px-4 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] text-center font-mono text-[20px] tracking-widest placeholder:text-[#86868B] dark:placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#0A84FF] transition-all"
                  />
                  {errors.otp && (
                    <p className="text-xs text-[#FF453A] mt-1 text-center">{errors.otp}</p>
                  )}
                </div>

                {resendSuccess && (
                  <div className="p-2.5 rounded-[12px] bg-[#30D158]/10 text-[#30D158] text-xs text-center flex items-center justify-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>New verification code sent to your email!</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[44px] rounded-full bg-[#0A84FF] hover:bg-[#0077ED] disabled:opacity-50 text-white text-[15px] font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify &amp; Activate Account</span>
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 flex items-center justify-between text-xs text-[#86868B] dark:text-[#8E8E93]">
                <button
                  type="button"
                  onClick={() => setIsVerifyingOtp(false)}
                  className="hover:underline flex items-center gap-1 cursor-pointer text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change email
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-[#0A84FF] hover:underline font-medium disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          ) : (
            /* Standard Email & Password Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#86868B] dark:text-[#8E8E93] block">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="w-full h-12 px-4 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] text-[15px] placeholder:text-[#86868B] dark:placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#0A84FF] transition-all"
                />
                {errors.email && (
                  <p className="text-xs text-[#FF453A] mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-medium text-[#86868B] dark:text-[#8E8E93] block">
                    Password
                  </label>
                  {mode === 'signup' && (
                    <span className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">
                      Min. 6 characters
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="w-full h-12 pl-4 pr-11 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] text-[15px] placeholder:text-[#86868B] dark:placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#0A84FF] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] p-1 cursor-pointer focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-[#FF453A] mt-1">{errors.password}</p>
                )}
              </div>

              {/* One-Time Security Notice on Sign-Up */}
              {mode === 'signup' && (
                <div className="p-3 rounded-[12px] bg-[#0A84FF]/8 border border-[#0A84FF]/15 flex items-start gap-2.5 text-[12px] text-[#1D1D1F] dark:text-[#F5F5F7] leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-[#0A84FF] shrink-0 mt-0.5" />
                  <span>
                    <strong>1-Time Security:</strong> A one-time verification code will be sent to confirm your email upon creation. Everyday logins will never ask for extra codes.
                  </span>
                </div>
              )}

              {/* General Error message */}
              {errors.general && (
                <div className="p-3 rounded-[12px] bg-[#FF453A]/10 text-[#FF453A] text-xs">
                  {errors.general}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[44px] rounded-full bg-[#0A84FF] hover:bg-[#0077ED] disabled:opacity-50 text-white text-[15px] font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'signin' ? (
                  'Sign in'
                ) : (
                  'Create account & Verify'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Bottom Toggle Link */}
        {!isVerifyingOtp && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-[14px] text-[#0A84FF] hover:underline font-medium cursor-pointer"
            >
              {mode === 'signin'
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        )}
      </div>

      {/* Option 2: One-Time Device Biometrics Setup Modal */}
      <BiometricEnrollmentModal
        isOpen={Boolean(pendingBiometricUser)}
        userId={pendingBiometricUser?.id || ''}
        userEmail={pendingBiometricUser?.email || ''}
        onComplete={() => setPendingBiometricUser(null)}
        onSkip={() => setPendingBiometricUser(null)}
      />

      <DatabaseSetupModal
        isOpen={isDbSetupModalOpen}
        onClose={() => setIsDbSetupModalOpen(false)}
      />
    </div>
  );
};

