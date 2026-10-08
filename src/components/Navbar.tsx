import React from 'react';
import { Button, Badge, StatusHiredLogo } from './ui/index.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  BriefcaseBusiness,
  Sun,
  Moon,
  Laptop,
  Database,
  FileText,
  Plus,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

interface NavbarProps {
  onOpenNewAppModal: () => void;
  onOpenResumeModal: () => void;
  onOpenDatabaseModal: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewAppModal,
  onOpenResumeModal,
  onOpenDatabaseModal,
  onOpenAuthModal,
}) => {
  const { theme, effectiveTheme, setTheme, toggleTheme } = useTheme();
  const { user, signOut, isConfigured } = useAuth();

  return (
    <header className="sticky top-0 z-40 glass-header transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <StatusHiredLogo size={36} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-lg tracking-tight text-slate-900 dark:text-[#E8EBF5]">
                Status<span className="text-[#0A84FF]">Hired</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-[#30D158]/12 text-[#30D158] border border-[#30D158]/20">
                v1.0
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 dark:text-[#8B93AB] -mt-0.5">
              Career Pipeline &amp; Supabase Integration
            </p>
          </div>
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Supabase status / SQL modal */}
          <button
            onClick={onOpenDatabaseModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border border-[#E8EAF2] dark:border-[#1F2437] hover:border-slate-300 dark:hover:border-slate-700 bg-white/80 dark:bg-[#121626]/80 text-slate-700 dark:text-[#E8EBF5] transition-colors"
            title="Supabase Schema & Configuration"
          >
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Supabase</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isConfigured ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
          </button>

          {/* Resumes Library */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenResumeModal}
            leftIcon={<FileText className="w-3.5 h-3.5 text-rose-500" />}
            className="hidden sm:inline-flex"
          >
            Resumes
          </Button>

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-[#8B93AB] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1f2437] border border-[#E8EAF2] dark:border-[#1F2437] transition-colors"
            title={`Current theme: ${theme} (Effective: ${effectiveTheme}). Click to toggle`}
            aria-label="Toggle theme"
          >
            {effectiveTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-violet-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>

          {/* User Auth controls */}
          {user ? (
            <div className="flex items-center gap-2">
              <div
                className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#121626] border border-[#E8EAF2] dark:border-[#1F2437] text-xs"
                title={user.email}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-[10px]">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
                <span className="max-w-[100px] truncate text-slate-700 dark:text-[#E8EBF5] font-medium">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-[#E8EAF2] dark:border-[#1F2437] transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenAuthModal}
              leftIcon={<LogIn className="w-3.5 h-3.5" />}
            >
              Sign In
            </Button>
          )}

          {/* New Application CTA */}
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenNewAppModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Job
          </Button>
        </div>
      </div>
    </header>
  );
};
