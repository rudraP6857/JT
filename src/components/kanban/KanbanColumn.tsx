import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Application, Stage, StageConfig } from '../../types/index.ts';
import { KanbanCard } from './KanbanCard.tsx';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  stage: StageConfig;
  applications: Application[];
  reminderAppIds: Set<string>;
  onAddClick: (stageId: Stage) => void;
  onCardClick: (app: Application) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  applications,
  onAddClick,
  onCardClick,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: {
      type: 'Column',
      stage: stage.id,
    },
  });

  const cardIds = applications.map((app) => app.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-full flex-1 snap-start p-3 rounded-[24px] transition-colors min-h-[520px] ${
        isOver
          ? 'bg-[#0A84FF]/8 ring-2 ring-[#0A84FF]/20'
          : 'bg-[#E5E5EA]/45 dark:bg-[#1C1C1E]/30 border border-black/4 dark:border-transparent'
      }`}
    >
      {/* Column Header: Dot + Title + Count */}
      <div className="flex items-center justify-between gap-2 px-2 py-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: stage.dotColor }}
          />
          <h3 className="font-bold text-[14px] text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
            {stage.label}
          </h3>
          <span className="text-[13px] text-[#86868B] dark:text-[#8E8E93] font-medium shrink-0">
            {applications.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAddClick(stage.id)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-white dark:hover:bg-[#2C2C2E] transition-colors cursor-pointer shrink-0"
          title={`Add in ${stage.label}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Cards List in SortableContext */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {applications.map((app) => (
            <KanbanCard
              key={app.id}
              application={app}
              onClick={() => onCardClick(app)}
            />
          ))}
        </SortableContext>

        {/* Minimal Drop zone if empty */}
        {applications.length === 0 && (
          <div
            onClick={() => onAddClick(stage.id)}
            className="h-28 rounded-[20px] border border-dashed border-[#E5E5EA] dark:border-[#38383A] hover:border-[#0A84FF] flex items-center justify-center p-4 text-center cursor-pointer transition-colors"
          >
            <p className="text-[13px] text-[#86868B] dark:text-[#8E8E93]">
              Drop here or tap +
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
