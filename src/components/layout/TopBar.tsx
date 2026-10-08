import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Search,
  Bell,
  Plus,
  Sun,
  Moon,
  CheckCircle2,
  ArrowRight,
  Building2,
} from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useSearch } from '../../context/SearchContext.tsx';
import { useReminderEngine } from '../../hooks/useReminderEngine.ts';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { StatusHiredLogo } from '../ui/StatusHiredLogo.tsx';

interface TopBarProps {
  onOpenCommandPalette?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenCommandPalette }) => {
  const location = useLocation();
  const { effectiveTheme, toggleTheme } = useTheme();
  const { openNewAppModal } = useSearch();
  const {
    dueReminders,
    unreadNotificationCount,
    snoozeReminder,
    toggleReminder,
    markAllDueAsDone,
  } = useReminderEngine();

  const [isBellDropdownOpen, setIsBellDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsBellDropdownOpen(false);
      }
    };
    if (isBellDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isBellDropdownOpen]);

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
      case '/dashboard':
        return 'Dashboard';
      case '/applications':
        return 'Applications';
      case '/board':
        return 'Board';
      case '/resumes':
        return 'Resumes';
      case '/reminders':
        return 'Reminders';
      default:
        return 'StatusHired';
    }
  };

  const title = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-30 h-20 frosted-topbar px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-colors">
      {/* Large Page Title (34px, weight 700, tracking -0.02em) */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="md:hidden shrink-0">
          <StatusHiredLogo size={32} />
        </div>
        <h1 className="text-[24px] sm:text-[34px] font-bold tracking-[-0.02em] text-[#1D1D1F] dark:text-[#F5F5F7] leading-tight truncate">
          {title}
        </h1>
      </div>

      {/* Right Controls: Search pill, Quiet Notification, Quiet Theme toggle, Solid "+ New" Pill */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search Command Palette Trigger */}
        <button
          type="button"
          onClick={() => onOpenCommandPalette?.()}
          className="h-10 px-3.5 sm:px-4 rounded-full bg-white/80 dark:bg-[#2C2C2E] hover:bg-white dark:hover:bg-[#3A3A3C] text-[#86868B] dark:text-[#8E8E93] text-[14px] flex items-center gap-2 transition-colors cursor-pointer border border-black/8 dark:border-transparent shadow-xs"
        >
          <Search className="w-4 h-4" strokeWidth={1.75} />
          <span className="hidden md:inline">Search</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-[#E5E5EA] dark:bg-[#1C1C1E] text-[#86868B] dark:text-[#8E8E93]">
            ⌘K
          </kbd>
        </button>

        {/* Quiet Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsBellDropdownOpen(!isBellDropdownOpen)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-[#E5E5EA]/40 dark:hover:bg-[#2C2C2E] transition-colors relative cursor-pointer"
            title={`${unreadNotificationCount} notifications`}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" strokeWidth={1.75} />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF453A]" />
            )}
          </button>

          {/* Notification Dropdown Panel */}
          <AnimatePresence>
            {isBellDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 mt-2 w-80 sm:w-96 rounded-[20px] bg-white dark:bg-[#1C1C1E] shadow-xl dark:border dark:border-[#38383A] p-4 z-50 text-left"
              >
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E5E5EA] dark:border-[#38383A]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[15px] text-[#1D1D1F] dark:text-[#F5F5F7]">
                      Notifications
                    </span>
                    {unreadNotificationCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FF453A]/12 text-[#FF453A]">
                        {unreadNotificationCount} due
                      </span>
                    )}
                  </div>

                  {dueReminders.length > 0 && (
                    <button
                      onClick={markAllDueAsDone}
                      className="text-[13px] font-medium text-[#0A84FF] hover:underline cursor-pointer"
                    >
                      Mark all done
                    </button>
                  )}
                </div>

                {/* Dropdown Scrollable List */}
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {dueReminders.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#86868B] dark:text-[#8E8E93]">
                      <CheckCircle2 className="w-8 h-8 text-[#30D158] mx-auto mb-2" />
                      <p className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                        All caught up
                      </p>
                      <p className="mt-0.5">No overdue or pending deadlines right now.</p>
                    </div>
                  ) : (
                    dueReminders.map((rem) => {
                      const timeAgo = formatDistanceToNow(new Date(rem.remind_at), { addSuffix: true });
                      return (
                        <div
                          key={rem.id}
                          className="p-3 rounded-[14px] bg-[#F2F2F7] dark:bg-[#2C2C2E] space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-bold text-[13px] text-[#1D1D1F] dark:text-[#F5F5F7] line-clamp-1">
                              {rem.title}
                            </h5>
                            <span className="text-[11px] font-medium text-[#FF453A] shrink-0">
                              {timeAgo}
                            </span>
                          </div>

                          {rem.applications && (
                            <p className="text-[12px] text-[#86868B] dark:text-[#8E8E93] flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-[#0A84FF] shrink-0" />
                              <span className="truncate">
                                {rem.applications.company_name} &bull; {rem.applications.role}
                              </span>
                            </p>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => snoozeReminder(rem.id, 1)}
                              className="px-2.5 py-1 rounded-full text-[12px] font-medium bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#E5E5EA] transition-colors cursor-pointer"
                            >
                              Snooze 1h
                            </button>
                            <button
                              onClick={() => toggleReminder(rem.id, true)}
                              className="px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#30D158]/15 text-[#30D158] hover:bg-[#30D158]/25 transition-colors cursor-pointer"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer link to full page */}
                <div className="pt-2.5 mt-2 border-t border-[#E5E5EA] dark:border-[#38383A] text-center">
                  <Link
                    to="/reminders"
                    onClick={() => setIsBellDropdownOpen(false)}
                    className="text-[13px] font-medium text-[#0A84FF] hover:underline flex items-center justify-center gap-1"
                  >
                    <span>View all reminders</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quiet Theme Toggle with smooth rotation */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-[#E5E5EA]/40 dark:hover:bg-[#2C2C2E] transition-colors cursor-pointer overflow-hidden"
          title={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          <motion.div
            key={effectiveTheme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {effectiveTheme === 'dark' ? (
              <Moon className="w-5 h-5" strokeWidth={1.75} />
            ) : (
              <Sun className="w-5 h-5" strokeWidth={1.75} />
            )}
          </motion.div>
        </button>

        {/* Prominent "+ New" solid pill button */}
        <Button
          variant="primary"
          size="md"
          onClick={() => openNewAppModal('saved')}
          leftIcon={<Plus className="w-4 h-4" strokeWidth={2.5} />}
        >
          <span className="hidden sm:inline">New Application</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>
    </header>
  );
};
