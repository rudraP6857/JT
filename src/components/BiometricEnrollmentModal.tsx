import React, { useState, useEffect } from 'react';
import { Fingerprint, ShieldCheck, Check, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { enrollDeviceBiometrics, isPlatformBiometricsAvailable } from '../lib/biometrics.ts';

interface BiometricEnrollmentModalProps {
  isOpen: boolean;
  userId: string;
  userEmail: string;
  onComplete: () => void;
  onSkip: () => void;
}

export const BiometricEnrollmentModal: React.FC<BiometricEnrollmentModalProps> = ({
  isOpen,
  userId,
  userEmail,
  onComplete,
  onSkip,
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'enrolling' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      isPlatformBiometricsAvailable().then((supported) => {
        setIsSupported(supported);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnroll = async () => {
    setIsLoading(true);
    setStatus('enrolling');
    setErrorMessage(null);

    const result = await enrollDeviceBiometrics(userId, userEmail);
    setIsLoading(false);

    if (result.success) {
      setStatus('success');
      setTimeout(() => {
        onComplete();
      }, 1200);
    } else {
      setStatus('error');
      setErrorMessage(result.error || 'Enrollment cancelled');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm p-6 sm:p-7 rounded-[24px] bg-white dark:bg-[#1C1C1E] border border-black/8 dark:border-[#38383A] shadow-2xl text-center">
        {/* Top Icon Badge */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center relative">
          <Fingerprint className="w-9 h-9" strokeWidth={1.8} />
          {status === 'success' && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#30D158] text-white flex items-center justify-center shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}
        </div>

        {/* Header */}
        <h3 className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
          {status === 'success'
            ? 'Device Secured!'
            : 'One-Time Device Security'}
        </h3>
        <p className="mt-1.5 text-[13.5px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
          {status === 'success'
            ? 'Touch ID / Face ID / Windows Hello is linked to your StatusHired account.'
            : 'Enroll device biometrics (Touch ID, Face ID, or Windows PIN) once to secure your account.'}
        </p>

        {/* Feature Highlights */}
        <div className="my-5 p-3.5 rounded-[16px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-left space-y-2 text-[12px] text-[#1D1D1F] dark:text-[#F5F5F7]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#30D158] shrink-0" />
            <span>One-time setup during sign up only</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0A84FF] shrink-0" />
            <span>Never required on everyday logins</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-[12px] bg-[#FF453A]/10 text-[#FF453A] text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {status !== 'success' ? (
            <>
              <button
                type="button"
                onClick={handleEnroll}
                disabled={isLoading}
                className="w-full h-11 rounded-full bg-[#0A84FF] hover:bg-[#0077ED] disabled:opacity-50 text-white text-[14.5px] font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    <span>Secure with Touch ID / Face ID</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onSkip}
                disabled={isLoading}
                className="w-full h-9 rounded-full text-[13px] text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] font-medium transition-colors cursor-pointer"
              >
                Skip for now
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onComplete}
              className="w-full h-11 rounded-full bg-[#30D158] text-white text-[14.5px] font-medium flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
