import React from 'react';
import { Modal } from './ui/Modal.tsx';
import { Keyboard, Command, Sparkles } from 'lucide-react';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({ isOpen, onClose }) => {
  const shortcuts = [
    { key: 'Cmd/Ctrl + K', description: 'Open global command palette & search' },
    { key: 'N', description: 'Create a new job application' },
    { key: 'R', description: 'Schedule a new reminder' },
    { key: 'G then B', description: 'Navigate to Pipeline Board' },
    { key: 'G then A', description: 'Navigate to Applications table' },
    { key: 'G then D', description: 'Navigate to Dashboard' },
    { key: '?', description: 'Show this keyboard shortcuts guide' },
    { key: 'Esc', description: 'Close any modal or active drawer' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Keyboard className="w-4 h-4" />
          </div>
          <span>Keyboard Shortcuts</span>
        </div>
      }
      description="Quickly navigate and manage your career pipeline with keybindings"
    >
      <div className="space-y-2.5 py-2">
        {shortcuts.map((sc, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#0d111e] border border-[#E8EAF2] dark:border-[#1F2437]"
          >
            <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-[#E8EBF5]">
              {sc.description}
            </span>
            <kbd className="px-2 py-1 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-[#121626] border border-[#E8EAF2] dark:border-[#1F2437] shadow-2xs">
              {sc.key}
            </kbd>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-[#E8EAF2] dark:border-[#1F2437] text-center text-xs text-slate-400">
        Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0d111e] text-[10px]">?</kbd> anywhere in the application to view this menu.
      </div>
    </Modal>
  );
};
