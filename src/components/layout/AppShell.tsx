import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar.tsx';
import { TopBar } from './TopBar.tsx';
import { MobileNav } from './MobileNav.tsx';
import { ApplicationModal } from '../ApplicationModal.tsx';
import { ReminderModal } from '../ReminderModal.tsx';
import { SettingsModal } from '../SettingsModal.tsx';
import { CommandPalette } from '../CommandPalette.tsx';
import { ShortcutsHelpModal } from '../ShortcutsHelpModal.tsx';
import { ApplicationDrawer } from '../ApplicationDrawer.tsx';
import { ErrorBoundary } from '../ErrorBoundary.tsx';
import { useSearch } from '../../context/SearchContext.tsx';
import { useApplications } from '../../hooks/useApplications.ts';
import { Application, Stage } from '../../types/index.ts';

export const AppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isNewAppModalOpen, setIsNewAppModalOpen, defaultNewAppStage, openNewAppModal } = useSearch();
  const { moveStage, deleteApplication } = useApplications();

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [isGlobalReminderOpen, setIsGlobalReminderOpen] = useState(false);
  const [selectedDrawerApp, setSelectedDrawerApp] = useState<Application | null>(null);
  const [editingDrawerApp, setEditingDrawerApp] = useState<Application | null>(null);

  // Global Keyboard Shortcuts
  useEffect(() => {
    let lastKey = '';
    let lastKeyTimeout: NodeJS.Timeout | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Command Palette: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Check if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInput) return;

      // 2. Help modal: ?
      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsHelpOpen(true);
        return;
      }

      // 3. New Application: N
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        openNewAppModal('saved');
        return;
      }

      // 4. New Reminder: R
      if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsGlobalReminderOpen(true);
        return;
      }

      // 5. Sequence: G then B, G then A, G then D, G then R, G then M
      const key = e.key.toLowerCase();
      if (lastKey === 'g') {
        if (key === 'b') {
          e.preventDefault();
          navigate('/board');
        } else if (key === 'a') {
          e.preventDefault();
          navigate('/applications');
        } else if (key === 'd') {
          e.preventDefault();
          navigate('/');
        } else if (key === 'r') {
          e.preventDefault();
          navigate('/resumes');
        } else if (key === 'm') {
          e.preventDefault();
          navigate('/reminders');
        }
        lastKey = '';
        if (lastKeyTimeout) clearTimeout(lastKeyTimeout);
      } else if (key === 'g') {
        lastKey = 'g';
        if (lastKeyTimeout) clearTimeout(lastKeyTimeout);
        lastKeyTimeout = setTimeout(() => {
          lastKey = '';
        }, 1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (lastKeyTimeout) clearTimeout(lastKeyTimeout);
    };
  }, [navigate, openNewAppModal]);

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors selection:bg-[#0A84FF] selection:text-white flex">
      {/* Fixed Desktop Sidebar */}
      <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-[240px] pb-20 md:pb-6">
        <TopBar
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Modals */}
      <ApplicationModal
        isOpen={isNewAppModalOpen}
        onClose={() => setIsNewAppModalOpen(false)}
        defaultStage={defaultNewAppStage as Stage}
      />

      <ReminderModal
        isOpen={isGlobalReminderOpen}
        onClose={() => setIsGlobalReminderOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNewApplication={() => openNewAppModal('saved')}
        onNewReminder={() => setIsGlobalReminderOpen(true)}
        onSelectApplication={(app) => setSelectedDrawerApp(app)}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <ShortcutsHelpModal
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />

      {/* Detail Drawer when an app is selected from Command Palette */}
      <ApplicationDrawer
        application={selectedDrawerApp}
        isOpen={Boolean(selectedDrawerApp)}
        onClose={() => setSelectedDrawerApp(null)}
        onEdit={(app) => {
          setSelectedDrawerApp(null);
          setEditingDrawerApp(app);
        }}
        onDelete={async (app) => {
          await deleteApplication(app.id);
          setSelectedDrawerApp(null);
        }}
        onAddReminder={() => {
          setIsGlobalReminderOpen(true);
        }}
        onStageChange={async (id, newStage) => {
          await moveStage(id, newStage);
          if (selectedDrawerApp) {
            setSelectedDrawerApp({ ...selectedDrawerApp, stage: newStage });
          }
        }}
      />

      {/* Editing modal for Drawer */}
      {editingDrawerApp && (
        <ApplicationModal
          isOpen={Boolean(editingDrawerApp)}
          onClose={() => setEditingDrawerApp(null)}
          applicationToEdit={editingDrawerApp}
        />
      )}
    </div>
  );
};
