import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Pencil,
  Trash2,
  Bell,
  ExternalLink,
  FileText,
  Clock,
} from 'lucide-react';
import { Application, Stage, StageHistory, STAGES_CONFIG } from '../types/index.ts';
import { Badge } from './ui/index.ts';
import { getCompanyAvatarInfo } from '../lib/avatar.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { format, formatDistanceToNow } from 'date-fns';
import { ResumePreviewModal } from './resumes/ResumePreviewModal.tsx';
import { useResumes } from '../hooks/useResumes.ts';

interface ApplicationDrawerProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
  onAddReminder: (appId: string) => void;
  onStageChange: (id: string, stage: Stage) => Promise<void>;
}

export const ApplicationDrawer: React.FC<ApplicationDrawerProps> = ({
  application,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAddReminder,
  onStageChange,
}) => {
  const { user } = useAuth();
  const { getSignedUrl } = useResumes();
  const [history, setHistory] = useState<StageHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Fetch stage history for this application
  useEffect(() => {
    if (!application || !isOpen) {
      setHistory([]);
      return;
    }

    const fetchHistory = async () => {
      if (!isSupabaseConfigured) {
        setHistory([
          {
            id: 'h-1',
            application_id: application.id,
            user_id: application.user_id,
            from_stage: null,
            to_stage: application.stage,
            changed_at: application.created_at,
          },
        ]);
        return;
      }

      try {
        setIsLoadingHistory(true);
        const { data, error } = await supabase
          .from('stage_history')
          .select('*')
          .eq('application_id', application.id)
          .order('changed_at', { ascending: false });

        if (!error && data) {
          setHistory(data);
        }
      } catch (err) {
        console.error('Failed to load stage history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [application, isOpen]);

  if (!application) return null;

  const avatar = getCompanyAvatarInfo(application.company_name);

  const stagesList: Stage[] = ['saved', 'applied', 'assessment', 'interview', 'selected', 'rejected'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            {/* Drawer Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-screen max-w-md bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col justify-between overflow-y-auto text-left"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#E5E5EA] dark:border-[#38383A] flex items-center justify-between gap-4 sticky top-0 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatar.classes}`}
                  >
                    {avatar.initial}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[17px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                      {application.company_name}
                    </h3>
                    <p className="text-[13px] text-[#86868B] dark:text-[#8E8E93] truncate">
                      {application.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEdit(application)}
                    className="w-9 h-9 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(application)}
                    className="w-9 h-9 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#FF453A] flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#86868B] dark:text-[#8E8E93] flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body Content with Hairline Grouped Sections */}
              <div className="p-6 space-y-6 flex-1">
                {/* Stage Pill & Quick Change Bar */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#86868B] dark:text-[#8E8E93] font-medium">
                      Current stage
                    </span>
                    <Badge variant="stage" stage={application.stage} size="md" />
                  </div>
                  <div className="grid grid-cols-6 gap-1 p-1 rounded-[14px] bg-[#F2F2F7] dark:bg-[#2C2C2E]">
                    {stagesList.map((st) => {
                      const isSelected = application.stage === st;
                      const cfg = STAGES_CONFIG[st];
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => onStageChange(application.id, st)}
                          className={`py-1.5 rounded-[10px] text-[11px] font-medium transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs'
                              : 'text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
                          }`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: cfg.dotColor }}
                          />
                          <span className="truncate max-w-full">{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Core Details Group with Hairline Separators */}
                <div className="rounded-[20px] bg-[#F2F2F7] dark:bg-[#2C2C2E] overflow-hidden divide-y divide-[#E5E5EA] dark:divide-[#38383A]">
                  {/* Applied Date */}
                  <div className="p-3.5 flex items-center justify-between text-[14px]">
                    <span className="text-[#86868B] dark:text-[#8E8E93]">Applied date</span>
                    <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {application.applied_date
                        ? format(new Date(application.applied_date), 'MMM d, yyyy')
                        : 'Not set'}
                    </span>
                  </div>

                  {/* CTC */}
                  {application.ctc && (
                    <div className="p-3.5 flex items-center justify-between text-[14px]">
                      <span className="text-[#86868B] dark:text-[#8E8E93]">Compensation</span>
                      <span className="font-medium text-[#30D158]">
                        {application.ctc}
                      </span>
                    </div>
                  )}

                  {/* Location */}
                  {application.location && (
                    <div className="p-3.5 flex items-center justify-between text-[14px]">
                      <span className="text-[#86868B] dark:text-[#8E8E93]">Location</span>
                      <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {application.location}
                      </span>
                    </div>
                  )}

                  {/* Job Type */}
                  {application.job_type && (
                    <div className="p-3.5 flex items-center justify-between text-[14px]">
                      <span className="text-[#86868B] dark:text-[#8E8E93]">Job type</span>
                      <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {application.job_type}
                      </span>
                    </div>
                  )}

                  {/* Source */}
                  {application.source && (
                    <div className="p-3.5 flex items-center justify-between text-[14px]">
                      <span className="text-[#86868B] dark:text-[#8E8E93]">Source</span>
                      <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {application.source}
                      </span>
                    </div>
                  )}

                  {/* Link */}
                  {application.link && (
                    <div className="p-3.5 flex items-center justify-between text-[14px]">
                      <span className="text-[#86868B] dark:text-[#8E8E93]">Job listing</span>
                      <a
                        href={application.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0A84FF] hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>Open link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Resume Attached Section */}
                {application.resumes && (
                  <div className="space-y-2">
                    <span className="text-[13px] text-[#86868B] dark:text-[#8E8E93] font-medium">
                      Attached resume
                    </span>
                    <div className="p-3.5 rounded-[16px] bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-[#0A84FF] shrink-0" />
                        <span className="text-[14px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                          {application.resumes.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPreviewOpen(true)}
                        className="text-[13px] font-medium text-[#0A84FF] hover:underline shrink-0 cursor-pointer"
                      >
                        View PDF
                      </button>
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                {application.notes && (
                  <div className="space-y-2">
                    <span className="text-[13px] text-[#86868B] dark:text-[#8E8E93] font-medium">
                      Notes
                    </span>
                    <div className="p-4 rounded-[16px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[14px] text-[#1D1D1F] dark:text-[#F5F5F7] whitespace-pre-wrap leading-relaxed">
                      {application.notes}
                    </div>
                  </div>
                )}

                {/* Stage History: Minimal Vertical Timeline */}
                <div className="space-y-3 pt-2">
                  <span className="text-[13px] text-[#86868B] dark:text-[#8E8E93] font-medium block">
                    Stage timeline
                  </span>

                  {isLoadingHistory ? (
                    <div className="p-3 text-[13px] text-[#86868B]">Loading history…</div>
                  ) : history.length === 0 ? (
                    <div className="p-3 text-[13px] text-[#86868B]">Created recently</div>
                  ) : (
                    <div className="space-y-3 pl-2 relative border-l border-[#E5E5EA] dark:border-[#38383A] ml-2">
                      {history.map((h, i) => {
                        const stageCfg = STAGES_CONFIG[h.to_stage] || STAGES_CONFIG.saved;
                        return (
                          <div key={h.id || i} className="relative pl-4 space-y-0.5">
                            {/* Dot on line */}
                            <span
                              className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white dark:ring-[#1C1C1E]"
                              style={{ backgroundColor: stageCfg.dotColor }}
                            />
                            <div className="flex items-center justify-between text-[13px]">
                              <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                                {stageCfg.label}
                              </span>
                              <span className="text-[12px] text-[#86868B] dark:text-[#8E8E93]">
                                {formatDistanceToNow(new Date(h.changed_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Quick Action */}
              <div className="p-5 border-t border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] sticky bottom-0">
                <button
                  type="button"
                  onClick={() => onAddReminder(application.id)}
                  className="w-full h-11 rounded-full bg-[#0A84FF] text-white text-[14px] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  <Bell className="w-4 h-4" />
                  <span>Set reminder for this job</span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* PDF Preview Modal */}
          {application.resumes && (
            <ResumePreviewModal
              resume={application.resumes}
              isOpen={isPreviewOpen}
              onClose={() => setIsPreviewOpen(false)}
              getSignedUrl={getSignedUrl}
            />
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
