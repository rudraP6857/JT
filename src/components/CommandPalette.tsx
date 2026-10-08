import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  LayoutDashboard,
  Layers,
  Kanban,
  FileText,
  Building2,
  ArrowRight,
  CornerDownLeft,
  X,
  FileCheck2,
} from 'lucide-react';
import { useApplications } from '../hooks/useApplications.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import { Application, Stage, STAGES_CONFIG } from '../types/index.ts';
import { Badge } from './ui/Badge.tsx';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewApplication: () => void;
  onNewReminder: () => void;
  onSelectApplication: (app: Application) => void;
}

type ItemType =
  | { type: 'action'; id: string; label: string; icon: any; action: () => void; category: string }
  | { type: 'app'; id: string; app: Application; category: string };

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNewApplication,
  onNewReminder,
  onSelectApplication,
}) => {
  const { applications } = useApplications();
  const { effectiveTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Quick action items
  const actions = useMemo(() => {
    return [
      {
        type: 'action' as const,
        id: 'act-new-app',
        label: 'Create New Application',
        icon: Plus,
        category: 'Quick Actions',
        action: () => {
          onClose();
          onNewApplication();
        },
      },
      {
        type: 'action' as const,
        id: 'act-new-reminder',
        label: 'Schedule a Reminder',
        icon: Bell,
        category: 'Quick Actions',
        action: () => {
          onClose();
          onNewReminder();
        },
      },
      {
        type: 'action' as const,
        id: 'act-toggle-theme',
        label: `Switch to ${effectiveTheme === 'dark' ? 'Light' : 'Dark'} Mode`,
        icon: effectiveTheme === 'dark' ? Sun : Moon,
        category: 'Quick Actions',
        action: () => {
          toggleTheme();
          onClose();
        },
      },
      {
        type: 'action' as const,
        id: 'act-nav-dashboard',
        label: 'Go to Dashboard',
        icon: LayoutDashboard,
        category: 'Navigation',
        action: () => {
          navigate('/');
          onClose();
        },
      },
      {
        type: 'action' as const,
        id: 'act-nav-apps',
        label: 'Go to Applications',
        icon: Layers,
        category: 'Navigation',
        action: () => {
          navigate('/applications');
          onClose();
        },
      },
      {
        type: 'action' as const,
        id: 'act-nav-board',
        label: 'Go to Pipeline Board',
        icon: Kanban,
        category: 'Navigation',
        action: () => {
          navigate('/board');
          onClose();
        },
      },
      {
        type: 'action' as const,
        id: 'act-nav-resumes',
        label: 'Go to Resumes',
        icon: FileText,
        category: 'Navigation',
        action: () => {
          navigate('/resumes');
          onClose();
        },
      },
      {
        type: 'action' as const,
        id: 'act-nav-reminders',
        label: 'Go to Reminders',
        icon: Bell,
        category: 'Navigation',
        action: () => {
          navigate('/reminders');
          onClose();
        },
      },
    ];
  }, [effectiveTheme, toggleTheme, onNewApplication, onNewReminder, onClose, navigate]);

  // Search filtered applications
  const matchedApps = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return applications
      .filter((app) => {
        return (
          app.company_name.toLowerCase().includes(q) ||
          app.role.toLowerCase().includes(q) ||
          (app.notes && app.notes.toLowerCase().includes(q)) ||
          (app.location && app.location.toLowerCase().includes(q))
        );
      })
      .map((app) => ({
        type: 'app' as const,
        id: `app-${app.id}`,
        app,
        category: 'Applications',
      }));
  }, [applications, query]);

  // Filtered actions when searching
  const filteredActions = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase().trim();
    return actions.filter((act) => act.label.toLowerCase().includes(q));
  }, [actions, query]);

  // Combined flat list for keyboard navigation
  const flatItems: ItemType[] = useMemo(() => {
    return [...matchedApps, ...filteredActions];
  }, [matchedApps, filteredActions]);

  // Clamp selected index
  useEffect(() => {
    if (selectedIndex >= flatItems.length) {
      setSelectedIndex(Math.max(0, flatItems.length - 1));
    }
  }, [flatItems.length, selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % Math.max(1, flatItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = flatItems[selectedIndex];
      if (current) {
        if (current.type === 'action') {
          current.action();
        } else {
          onClose();
          onSelectApplication(current.app);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 pb-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs"
          />

          {/* Palette Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#121626] border border-[#E8EAF2] dark:border-[#1F2437] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]"
          >
            {/* Input Header */}
            <div className="relative flex items-center px-4 py-3.5 border-b border-[#E8EAF2] dark:border-[#1F2437]">
              <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search companies, roles, notes, or trigger an action..."
                className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-[#E8EBF5] placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
              />
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-[#0B0E17] border border-[#E8EAF2] dark:border-[#1F2437]">
                  ESC
                </kbd>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List Results */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
              {flatItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <p>No results found for "{query}".</p>
                  <p className="mt-1 text-slate-500">Try searching for a company name or role.</p>
                </div>
              ) : (
                flatItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;

                  if (item.type === 'app') {
                    const cfg = STAGES_CONFIG[item.app.stage as Stage] || STAGES_CONFIG.saved;
                    return (
                      <div
                        key={item.id}
                        data-selected={isSelected}
                        onClick={() => {
                          onClose();
                          onSelectApplication(item.app);
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-slate-900 dark:text-white'
                            : 'hover:bg-slate-50 dark:hover:bg-[#181d33] text-slate-700 dark:text-[#E8EBF5]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-heading font-bold text-xs sm:text-sm truncate">
                                {item.app.company_name}
                              </h5>
                              <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                                &bull; {item.app.role}
                              </span>
                            </div>
                            {item.app.notes && (
                              <p className="text-[11px] text-slate-500 dark:text-[#8B93AB] truncate max-w-sm">
                                {item.app.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="stage" stage={item.app.stage} dot />
                          {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-indigo-500" />}
                        </div>
                      </div>
                    );
                  }

                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      data-selected={isSelected}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-slate-900 dark:text-white'
                          : 'hover:bg-slate-50 dark:hover:bg-[#181d33] text-slate-700 dark:text-[#E8EBF5]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#1a2035] text-slate-600 dark:text-[#8B93AB] flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium truncate">
                          {item.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold hidden sm:inline">
                          {item.category}
                        </span>
                        {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-indigo-500" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Navigation Hints */}
            <div className="p-3 border-t border-[#E8EAF2] dark:border-[#1F2437] bg-slate-50/70 dark:bg-[#0e1220]/70 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-white dark:bg-[#121626] border border-[#E8EAF2] dark:border-[#1F2437] text-[10px]">
                    &uarr; &darr;
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-white dark:bg-[#121626] border border-[#E8EAF2] dark:border-[#1F2437] text-[10px]">
                    &crarr;
                  </kbd>
                  <span>Select</span>
                </span>
              </div>
              <span>StatusHired Command Palette</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
