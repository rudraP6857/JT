import React from 'react';
import { Card, Badge, Button } from './ui/index.ts';
import { Application, Stage, STAGES_CONFIG } from '../types/index.ts';
import { useJobTracker } from '../context/JobTrackerContext.tsx';
import {
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  ExternalLink,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  Bell,
  Pencil,
  Trash2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ApplicationCardProps {
  application: Application;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  onAddReminder: (appId: string) => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onEdit,
  onDelete,
  onAddReminder,
}) => {
  const { updateStage, getResumeUrl } = useJobTracker();

  const stagesList: Stage[] = ['saved', 'applied', 'assessment', 'interview', 'selected', 'rejected'];
  const currentIndex = stagesList.indexOf(application.stage);

  const prevStage = currentIndex > 0 ? stagesList[currentIndex - 1] : null;
  const nextStage = currentIndex < stagesList.length - 1 ? stagesList[currentIndex + 1] : null;

  const handleOpenResume = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (application.resumes) {
      const url = await getResumeUrl(application.resumes.file_path);
      if (url && url !== '#') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const formattedDate = application.applied_date
    ? format(new Date(application.applied_date), 'MMM d, yyyy')
    : null;

  return (
    <Card
      padding="sm"
      hoverable
      className="group relative flex flex-col justify-between border-[#E8EAF2] dark:border-[#1F2437] transition-all bg-white dark:bg-[#121626]"
    >
      <div>
        {/* Top Header: Company Name & Actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-[#E8EBF5] truncate">
              {application.company_name}
            </h4>
            <p className="text-xs font-medium text-slate-600 dark:text-[#8B93AB] truncate mt-0.5">
              {application.role}
            </p>
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
            {application.link && (
              <a
                href={application.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                title="Open job link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={() => onEdit(application)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Edit application"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(application.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
              title="Delete application"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Metadata badges (CTC, Location, Job Type) */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
          {application.ctc && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
              <DollarSign className="w-3 h-3 -mr-0.5" />
              {application.ctc}
            </span>
          )}

          {application.location && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1f2437] text-slate-600 dark:text-[#8B93AB]">
              <MapPin className="w-3 h-3" />
              <span className="max-w-[110px] truncate">{application.location}</span>
            </span>
          )}

          {application.job_type && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1f2437] text-slate-600 dark:text-[#8B93AB]">
              {application.job_type}
            </span>
          )}
        </div>

        {/* Attached Resume */}
        {application.resumes && (
          <div
            onClick={handleOpenResume}
            className="flex items-center gap-1.5 px-2 py-1 mb-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-700 dark:text-indigo-300 cursor-pointer hover:bg-indigo-100/70 transition-colors truncate"
            title={`View attached resume: ${application.resumes.name}`}
          >
            <FileText className="w-3 h-3 shrink-0 text-indigo-500" />
            <span className="truncate">{application.resumes.name}</span>
          </div>
        )}

        {/* Notes Preview if available */}
        {application.notes && (
          <p className="text-[11px] text-slate-500 dark:text-[#8B93AB] bg-slate-50 dark:bg-[#0B0E17]/40 p-2 rounded-lg line-clamp-2 mb-3 border border-slate-100 dark:border-slate-800/40">
            {application.notes}
          </p>
        )}
      </div>

      {/* Footer: Date applied & stage movement buttons */}
      <div className="pt-2 border-t border-[#E8EAF2]/80 dark:border-[#1F2437]/80 flex items-center justify-between gap-1 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          {formattedDate ? (
            <span className="flex items-center gap-1 truncate text-slate-500 dark:text-[#8B93AB]">
              <Calendar className="w-3 h-3 shrink-0" />
              {formattedDate}
            </span>
          ) : (
            <span className="italic text-slate-400">Not applied yet</span>
          )}
        </div>

        {/* Action icons: Reminder & Stage Shifts */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onAddReminder(application.id)}
            className="p-1 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-400 hover:text-amber-500 transition-colors"
            title="Add reminder for this application"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          {prevStage && (
            <button
              onClick={() => updateStage(application.id, prevStage)}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#1f2437] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title={`Move back to ${STAGES_CONFIG[prevStage].label}`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {nextStage && (
            <button
              onClick={() => updateStage(application.id, nextStage)}
              className="p-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-500 hover:text-indigo-600 transition-colors"
              title={`Move forward to ${STAGES_CONFIG[nextStage].label}`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};
