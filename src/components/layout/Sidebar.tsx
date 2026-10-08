import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Briefcase,
  LayoutDashboard,
  Layers,
  Kanban,
  FileText,
  Bell,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useJobTracker } from '../../context/JobTrackerContext.tsx';
import { StatusHiredLogo } from '../ui/StatusHiredLogo.tsx';

interface SidebarProps {
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  const { user, signOut } = useAuth();
  const { applications, reminders } = useJobTracker();

  const pendingReminders = reminders.filter((r) => !r.is_done).length;

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/applications',
      label: 'Applications',
      icon: Layers,
      badge: applications.length > 0 ? applications.length : null,
    },
    {
      to: '/board',
      label: 'Board',
      icon: Kanban,
      badge: null,
    },
    {
      to: '/resumes',
      label: 'Resumes',
      icon: FileText,
      badge: null,
    },
    {
      to: '/reminders',
      label: 'Reminders',
      icon: Bell,
      badge: pendingReminders > 0 ? pendingReminders : null,
    },
  ];

  const getInitials = (email?: string, name?: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return 'JT';
  };

  return (
    <aside className="hidden md:flex flex-col w-[240px] h-screen fixed left-0 top-0 z-30 bg-white dark:bg-[#1C1C1E] border-r border-[#E5E5EA] dark:border-[#38383A] transition-colors select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center">
        <StatusHiredLogo variant="full" size={32} showBadge />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-[14px] text-[15px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#0A84FF]/10 text-[#0A84FF]'
                    : 'text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-[#E5E5EA]/40 dark:hover:bg-[#2C2C2E]/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive ? 'text-[#0A84FF]' : 'text-[#86868B] dark:text-[#8E8E93]'
                      }`}
                      strokeWidth={1.75}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-[#0A84FF]/15 text-[#0A84FF]'
                          : 'bg-[#8E8E93]/15 text-[#636366] dark:text-[#AEAEB2]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section at Bottom: minimal avatar with initials & quiet actions */}
      <div className="p-3 border-t border-[#E5E5EA] dark:border-[#38383A]">
        <div className="flex items-center justify-between p-2 rounded-[14px] bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/4 dark:border-transparent">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#0A84FF] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {getInitials(user?.email, user?.user_metadata?.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition-colors cursor-pointer"
                title="Settings"
                aria-label="Settings"
              >
                <SettingsIcon className="w-4 h-4" strokeWidth={1.75} />
              </button>
            )}
            <button
              type="button"
              onClick={() => signOut()}
              className="p-1.5 rounded-lg text-[#86868B] dark:text-[#8E8E93] hover:text-[#FF453A] transition-colors cursor-pointer"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
