import React, { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import confetti from 'canvas-confetti';
import { Application, Stage, STAGES_CONFIG } from '../types/index.ts';
import { useApplications } from '../hooks/useApplications.ts';
import { useJobTracker } from '../context/JobTrackerContext.tsx';
import { useSearch } from '../context/SearchContext.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import { KanbanColumn } from '../components/kanban/KanbanColumn.tsx';
import { KanbanCard } from '../components/kanban/KanbanCard.tsx';
import { ApplicationModal } from '../components/ApplicationModal.tsx';
import { ApplicationDrawer } from '../components/ApplicationDrawer.tsx';
import { ReminderModal } from '../components/ReminderModal.tsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { Search, X } from 'lucide-react';

export const Board: React.FC = () => {
  useDocumentTitle('Board');

  const {
    applications,
    isLoading,
    moveStage,
    deleteApplication,
  } = useApplications();

  const { reminders } = useJobTracker();
  const { searchQuery, setSearchQuery } = useSearch();
  const { info } = useToast();

  // Modals and Drawer state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAddStage, setSelectedAddStage] = useState<Stage>('saved');
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [selectedDrawerApp, setSelectedDrawerApp] = useState<Application | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderAppId, setReminderAppId] = useState<string | null>(null);

  // DnD Active State for DragOverlay
  const [activeApp, setActiveApp] = useState<Application | null>(null);

  // Sensors setup for Touch, Pointer and Keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        app.company_name.toLowerCase().includes(q) ||
        app.role.toLowerCase().includes(q) ||
        (app.location && app.location.toLowerCase().includes(q))
      );
    });
  }, [applications, searchQuery]);

  // Stage columns in strict order
  const stageKeys: Stage[] = ['saved', 'applied', 'assessment', 'interview', 'selected', 'rejected'];

  // Applications grouped by stage
  const columnsData = useMemo(() => {
    const map: Record<Stage, Application[]> = {
      saved: [],
      applied: [],
      assessment: [],
      interview: [],
      selected: [],
      rejected: [],
    };
    for (const app of filteredApplications) {
      if (map[app.stage]) {
        map[app.stage].push(app);
      } else {
        map.saved.push(app);
      }
    }
    return map;
  }, [filteredApplications]);

  // Handle Drag Start
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const app = applications.find((a) => a.id === active.id);
      if (app) {
        setActiveApp(app);
      }
    },
    [applications]
  );

  // Handle Drag Over
  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Handled visually by @dnd-kit
  }, []);

  // Handle Drag End
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveApp(null);

      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      const targetApp = applications.find((a) => a.id === activeId);
      if (!targetApp) return;

      let destinationStage: Stage | null = null;

      // 1. Dropped directly over a column container
      if (stageKeys.includes(overId as Stage)) {
        destinationStage = overId as Stage;
      } else {
        // 2. Dropped over another card in a column
        const overApp = applications.find((a) => a.id === overId);
        if (overApp) {
          destinationStage = overApp.stage;
        }
      }

      if (!destinationStage) return;

      if (targetApp.stage !== destinationStage) {
        const previousStage = targetApp.stage;

        try {
          await moveStage(targetApp.id, destinationStage);

          // Confetti celebratory burst if moved to "selected"
          if (destinationStage === 'selected') {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#30D158', '#0A84FF', '#BF5AF2', '#FF9F0A', '#FFD60A'],
            });
          }

          // Reminder prompt toast if moved to "interview"
          if (destinationStage === 'interview') {
            info(
              `Moved ${targetApp.company_name} to Interview!`,
              'Would you like to schedule prep?',
              {
                label: 'Set Reminder',
                onClick: () => {
                  setReminderAppId(targetApp.id);
                  setIsReminderModalOpen(true);
                },
              }
            );
          }
        } catch (err) {
          console.error('Failed to move stage:', err);
        }
      }
    },
    [applications, moveStage, stageKeys, info]
  );

  return (
    <div className="space-y-6">
      {/* Top Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-[#86868B] dark:text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search board…"
            className="w-full h-10 pl-10 pr-9 rounded-full bg-white dark:bg-[#1C1C1E] text-[14px] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] dark:placeholder-[#8E8E93] outline-none focus:ring-2 focus:ring-[#0A84FF]/30 transition-all border border-black/8 dark:border-[#38383A] shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board Horizontal Columns Container */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory no-scrollbar min-h-[600px]">
          {stageKeys.map((stageKey) => {
            const config = STAGES_CONFIG[stageKey];
            const columnApps = columnsData[stageKey] || [];

            return (
              <KanbanColumn
                key={stageKey}
                stage={config}
                applications={columnApps}
                reminderAppIds={new Set()}
                onAddClick={(stageId) => {
                  setSelectedAddStage(stageId);
                  setIsAddModalOpen(true);
                }}
                onCardClick={(app) => {
                  setSelectedDrawerApp(app);
                }}
              />
            );
          })}
        </div>

        {/* Drag Overlay with slight rotation */}
        <DragOverlay>
          {activeApp ? (
            <KanbanCard application={activeApp} isOverlay={true} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Detail Drawer */}
      <ApplicationDrawer
        application={selectedDrawerApp}
        isOpen={Boolean(selectedDrawerApp)}
        onClose={() => setSelectedDrawerApp(null)}
        onEdit={(app) => {
          setSelectedDrawerApp(null);
          setEditingApp(app);
          setIsAddModalOpen(true);
        }}
        onDelete={async (app) => {
          setSelectedDrawerApp(null);
          await deleteApplication(app.id);
        }}
        onAddReminder={(appId) => {
          setReminderAppId(appId);
          setIsReminderModalOpen(true);
        }}
        onStageChange={async (id, stage) => {
          await moveStage(id, stage);
        }}
      />

      {/* Add / Edit Sheet Modal */}
      <ApplicationModal
        isOpen={isAddModalOpen}
        defaultStage={selectedAddStage}
        applicationToEdit={editingApp}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingApp(null);
        }}
      />

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => {
          setIsReminderModalOpen(false);
          setReminderAppId(null);
        }}
        preselectedAppId={reminderAppId || undefined}
      />
    </div>
  );
};
