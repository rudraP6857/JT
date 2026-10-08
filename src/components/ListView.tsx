import React from 'react';
import { Application, Stage, STAGES_CONFIG } from '../types/index.ts';
import { Badge, Button } from './ui/index.ts';
import { useJobTracker } from '../context/JobTrackerContext.tsx';
import {
  ExternalLink,
  Pencil,
  Trash2,
  Calendar,
  FileText,
  MapPin,
  DollarSign,
  Bell,
} from 'lucide-react';
import { format } from 'date-fns';

interface ListViewProps {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  onAddReminder: (appId: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  applications,
  onEdit,
  onDelete,
  onAddReminder,
}) => {
  const { updateStage, getResumeUrl } = useJobTracker();

  const handleOpenResume = async (e: React.MouseEvent, filePath?: string) => {
    e.stopPropagation();
    if (filePath) {
      const url = await getResumeUrl(filePath);
      if (url && url !== '#') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <div className="rounded-2xl border border-[#E8EAF2] dark:border-[#1F2437] bg-white dark:bg-[#121626] overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E8EAF2] dark:border-[#1F2437] bg-slate-50/75 dark:bg-[#0d111e]/80 text-slate-500 dark:text-[#8B93AB]">
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Company &amp; Role</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Stage</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Compensation</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Location / Type</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Applied Date</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Resume</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8EAF2] dark:divide-[#1F2437]">
            {applications.map((app) => (
              <tr
                key={app.id}
                className="hover:bg-slate-50/50 dark:hover:bg-[#181d33]/50 transition-colors"
              >
                {/* Company & Role */}
                <td className="py-3.5 px-4">
                  <div className="font-heading font-bold text-sm text-slate-900 dark:text-[#E8EBF5]">
                    {app.company_name}
                  </div>
                  <div className="text-slate-500 dark:text-[#8B93AB] mt-0.5">
                    {app.role}
                  </div>
                </td>

                {/* Stage */}
                <td className="py-3.5 px-4">
                  <select
                    value={app.stage}
                    onChange={(e) => updateStage(app.id, e.target.value as Stage)}
                    className="text-xs rounded-full font-medium px-2.5 py-1 border outline-none cursor-pointer bg-white dark:bg-[#121626] text-slate-800 dark:text-[#E8EBF5] border-[#E8EAF2] dark:border-[#1F2437]"
                  >
                    {Object.values(STAGES_CONFIG).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Compensation */}
                <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                  {app.ctc || <span className="text-slate-400">—</span>}
                </td>

                {/* Location / Type */}
                <td className="py-3.5 px-4 text-slate-600 dark:text-[#8B93AB]">
                  <div>{app.location || '—'}</div>
                  {app.job_type && (
                    <span className="text-[10px] text-slate-400">{app.job_type}</span>
                  )}
                </td>

                {/* Applied Date */}
                <td className="py-3.5 px-4 text-slate-600 dark:text-[#8B93AB]">
                  {app.applied_date ? (
                    format(new Date(app.applied_date), 'MMM d, yyyy')
                  ) : (
                    <span className="text-slate-400 italic">Not yet</span>
                  )}
                </td>

                {/* Resume */}
                <td className="py-3.5 px-4">
                  {app.resumes ? (
                    <button
                      onClick={(e) => handleOpenResume(e, app.resumes?.file_path)}
                      className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline max-w-[140px] truncate"
                      title={app.resumes.name}
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{app.resumes.name}</span>
                    </button>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {app.link && (
                      <a
                        href={app.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Job Posting Link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => onAddReminder(app.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-amber-500 transition-colors"
                      title="Set reminder"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(app)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      title="Edit application"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(app.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
