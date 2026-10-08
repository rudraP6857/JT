import React, { useState } from 'react';
import { useReminderEngine } from '../hooks/useReminderEngine.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { ThemePreference } from '../types/index.ts';
import { X, Check, Download, ArrowDownToLine, Database, ChevronRight, Fingerprint, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DatabaseSetupModal } from './DatabaseSetupModal.tsx';
import { isPlatformBiometricsAvailable, getBiometricEnrollment, enrollDeviceBiometrics } from '../lib/biometrics.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { browserNotificationsEnabled, requestNotificationPermission } = useReminderEngine();
  const { theme, setTheme } = useTheme();
  const { user, isConfigured } = useAuth();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDbSetupOpen, setIsDbSetupOpen] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(() => {
    return user ? getBiometricEnrollment(user.id).isEnrolled : false;
  });
  const [isEnrollingBio, setIsEnrollingBio] = useState(false);

  const handleEnrollBioFromSettings = async () => {
    if (!user || isEnrollingBio) return;
    setIsEnrollingBio(true);
    const res = await enrollDeviceBiometrics(user.id, user.email || 'user@statushired.app');
    setIsEnrollingBio(false);
    if (res.success) {
      setBiometricEnrolled(true);
    }
  };

  const handleToggleNotifications = async () => {
    setIsRequesting(true);
    try {
      await requestNotificationPermission();
    } finally {
      setIsRequesting(false);
    }
  };

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Small Apple-style Sheet Modal (Radius 24px) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm rounded-[24px] bg-white dark:bg-[#1C1C1E] shadow-2xl p-6 z-10 space-y-5 text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA] dark:border-[#38383A]">
            <h3 className="text-[18px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Settings
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#E5E5EA]/60 dark:bg-[#2C2C2E] text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Segmented Picker */}
          <div className="space-y-2">
            <span className="text-[13px] text-[#86868B] dark:text-[#8E8E93] font-medium block">
              Appearance
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-[14px] bg-[#F2F2F7] dark:bg-[#2C2C2E]">
              {themeOptions.map((opt) => {
                const isSelected = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={`py-2 px-2 rounded-[10px] text-[13px] font-medium transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs'
                        : 'text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-[#F2F2F7] dark:bg-[#2C2C2E]">
            <div>
              <p className="text-[14px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                Browser Alerts
              </p>
              <p className="text-[12px] text-[#86868B] dark:text-[#8E8E93]">
                Upcoming deadlines
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleNotifications}
              disabled={isRequesting}
              className={`w-12 h-7 rounded-full p-0.5 transition-colors cursor-pointer ${
                browserNotificationsEnabled ? 'bg-[#30D158]' : 'bg-[#E5E5EA] dark:bg-[#38383A]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                  browserNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Database Mode Status & Setup Guide */}
          <div className="p-3.5 rounded-[16px] bg-[#F2F2F7] dark:bg-[#2C2C2E] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Database Status
                </p>
                <p className="text-[12px] text-[#86868B] dark:text-[#8E8E93]">
                  {isConfigured ? 'Connected to live Supabase cloud' : 'Configuration required in .env'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConfigured ? 'bg-[#30D158] animate-pulse' : 'bg-[#FF9F0A]'
                  }`}
                />
                <span className="text-[12px] font-medium text-[#86868B] dark:text-[#8E8E93]">
                  {isConfigured ? 'Connected' : 'Missing Keys'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDbSetupOpen(true)}
              className="w-full mt-1 pt-2 border-t border-[#E5E5EA] dark:border-[#38383A] flex items-center justify-between text-[12px] text-[#0A84FF] hover:underline font-medium cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Find Supabase Keys &amp; Setup Guide
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Device Biometrics & Security Tile */}
          <div className="p-3.5 rounded-[16px] bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Device Biometrics
                </p>
                <p className="text-[12px] text-[#86868B] dark:text-[#8E8E93]">
                  {biometricEnrolled ? 'Touch ID / Face ID Active' : 'One-time hardware passkey'}
                </p>
              </div>
            </div>
            {biometricEnrolled ? (
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#30D158]">
                <ShieldCheck className="w-4 h-4" />
                <span>Enrolled</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleEnrollBioFromSettings}
                disabled={isEnrollingBio}
                className="px-3 py-1 rounded-full bg-[#0A84FF] text-white text-[12px] font-medium hover:bg-[#0077ED] transition-colors cursor-pointer"
              >
                {isEnrollingBio ? 'Enrolling…' : 'Enroll'}
              </button>
            )}
          </div>

          {/* Export / Download Code ZIP */}
          <a
            href="/statushired-app.zip"
            download="statushired-app.zip"
            className="flex items-center justify-between p-3.5 rounded-[16px] bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] transition-colors cursor-pointer text-[#1D1D1F] dark:text-[#F5F5F7] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[14px] font-medium">Download Project ZIP</p>
                <p className="text-[12px] text-[#86868B] dark:text-[#8E8E93]">
                  Fixed & ready for local testing
                </p>
              </div>
            </div>
            <ArrowDownToLine className="w-4 h-4 text-[#86868B] dark:text-[#8E8E93] group-hover:text-[#0A84FF] transition-colors" />
          </a>

          {/* User Account Details */}
          <div className="pt-2 text-center text-[12px] text-[#86868B] dark:text-[#8E8E93]">
            Signed in as {user?.email || 'Demo user'}
          </div>
        </motion.div>
      </div>

      {/* Supabase Database & Storage Setup Guide Modal */}
      <DatabaseSetupModal
        isOpen={isDbSetupOpen}
        onClose={() => setIsDbSetupOpen(false)}
      />
    </AnimatePresence>
  );
};
