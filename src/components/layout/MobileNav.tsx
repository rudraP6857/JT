import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Kanban,
  FileText,
  Bell,
  Plus,
} from 'lucide-react';
import { useSearch } from '../../context/SearchContext.tsx';
import { useJobTracker } from '../../context/JobTrackerContext.tsx';

export const MobileNav: React.FC = () => {
  const { openNewAppModal } = useSearch();
  const { reminders } = useJobTracker();
  const pendingReminders = reminders.filter((r) => !r.is_done).length;

  const tabs = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/applications', label: 'Apps', icon: Layers },
    { to: '/board', label: 'Board', icon: Kanban },
    { to: '/resumes', label: 'Resumes', icon: FileText },
    { to: '/reminders', label: 'Reminders', icon: Bell, badge: pendingReminders },
  ];

  return (
    <>
      {/* Floating Action Button for "+ New" on mobile */}
      <div className="md:hidden fixed bottom-20 right-5 z-40">
        <button
          onClick={() => openNewAppModal('saved')}
          className="w-14 h-14 rounded-full bg-[#0A84FF] text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Create New Application"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 frosted-topbar flex items-center justify-around px-2 pb-safe">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 min-h-[44px] min-w-[44px] rounded-full text-[11px] font-medium transition-all ${
                  isActive
                    ? 'text-[#0A84FF] font-semibold'
                    : 'text-[#86868B] dark:text-[#8E8E93]'
                }`
              }
            >
              {({ isActive }) => (
                <div className="relative flex flex-col items-center">
                  <Icon className="w-5 h-5 mb-0.5" strokeWidth={isActive ? 2.2 : 1.75} />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-[#FF453A]" />
                  ) : null}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
