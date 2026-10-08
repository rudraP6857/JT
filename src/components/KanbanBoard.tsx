import React from 'react';
import { Application, Stage, STAGES_CONFIG } from '../types/index.ts';
import { ApplicationCard } from './ApplicationCard.tsx';
import { Plus } from 'lucide-react';

interface KanbanBoardProps {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  onAddReminder: (appId: string) => void;
  onAddInStage: (stage: Stage) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  onEdit,
  onDelete,
  onAddReminder,
  onAddInStage,
}) => {
  const stages: Stage[] = ['saved', 'applied', 'assessment', 'interview', 'selected', 'rejected'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start pb-6">
      {stages.map((stageKey) => {
        const config = STAGES_CONFIG[stageKey];
        const stageApps = applications.filter((app) => app.stage === stageKey);

        return (
          <div
            key={stageKey}
            className="flex flex-col rounded-2xl bg-slate-100/60 dark:bg-[#0d111e]/70 border border-[#E8EAF2] dark:border-[#1F2437] p-3 min-h-[480px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between gap-2 pb-3 mb-2 border-b border-[#E8EAF2] dark:border-[#1F2437]">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: config.dotColor }}
                />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-[#E8EBF5]">
                  {config.label}
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-[#121626] text-slate-600 dark:text-[#8B93AB] border border-[#E8EAF2] dark:border-[#1F2437] shadow-2xs">
                  {stageApps.length}
                </span>
              </div>

              <button
                onClick={() => onAddInStage(stageKey)}
                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-[#121626] transition-colors"
                title={`Add application to ${config.label}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Application Cards List */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              {stageApps.length === 0 ? (
                <div
                  onClick={() => onAddInStage(stageKey)}
                  className="h-28 rounded-xl border border-dashed border-slate-300 dark:border-slate-800/80 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:border-indigo-400 hover:bg-white/40 dark:hover:bg-[#121626]/40 transition-colors group"
                >
                  <p className="text-xs text-slate-400 group-hover:text-indigo-500 font-medium">
                    + Drop or Add Job
                  </p>
                </div>
              ) : (
                stageApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAddReminder={onAddReminder}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
