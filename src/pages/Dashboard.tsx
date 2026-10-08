import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useApplications } from '../hooks/useApplications.ts';
import { useReminderEngine } from '../hooks/useReminderEngine.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { Application, STAGES_CONFIG } from '../types/index.ts';
import { getCompanyAvatarInfo } from '../lib/avatar.ts';
import { Badge, EmptyState } from '../components/ui/index.ts';
import { AnimatedNumber } from '../components/ui/AnimatedNumber.tsx';
import { DashboardCharts } from '../components/dashboard/DashboardCharts.tsx';
import { ApplicationDrawer } from '../components/ApplicationDrawer.tsx';
import { ReminderModal } from '../components/ReminderModal.tsx';
import { ApplicationModal } from '../components/ApplicationModal.tsx';

export const Dashboard: React.FC = () => {
  useDocumentTitle('Dashboard');

  const { applications, moveStage, deleteApplication } = useApplications();
  const { reminders, toggleReminder } = useReminderEngine();
  const { user } = useAuth();

  // Selected app for detail drawer
  const [selectedDrawerApp, setSelectedDrawerApp] = useState<Application | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Display user name
  const displayName = useMemo(() => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return '';
  }, [user]);

  // Today's formatted date
  const todayFormatted = useMemo(() => {
    return format(new Date(), 'EEEE, MMMM d');
  }, []);

  // 4 Core Counts
  const totalCount = applications.length;

  const activeCount = useMemo(() => {
    return applications.filter((a) => ['applied', 'assessment', 'interview'].includes(a.stage)).length;
  }, [applications]);

  const interviewCount = useMemo(() => {
    return applications.filter((a) => a.stage === 'interview').length;
  }, [applications]);

  const selectedCount = useMemo(() => {
    return applications.filter((a) => a.stage === 'selected').length;
  }, [applications]);

  // Next 3 upcoming reminders
  const next3Reminders = useMemo(() => {
    return reminders
      .filter((r) => !r.is_done)
      .sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime())
      .slice(0, 3);
  }, [reminders]);

  // Last 5 recent applications
  const recent5Apps = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [applications]);

  return (
    <div className="space-y-8">
      {/* Top Greeting */}
      <div>
        <p className="text-[13px] font-medium text-[#86868B] dark:text-[#8E8E93]">
          {todayFormatted}
        </p>
        <h2 className="text-[28px] sm:text-[34px] font-bold tracking-[-0.02em] text-[#1D1D1F] dark:text-[#F5F5F7] mt-0.5">
          {greeting}{displayName ? `, ${displayName}` : ''}
        </h2>
      </div>

      {/* 4 Clean Apple Health Stat Cards: small colored dot, label in muted text, big 40px number */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Applications */}
        <div className="apple-card p-5 transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0A84FF] shrink-0" />
            <span className="text-[13px] text-[#86868B] dark:text-[#8E8E93] font-medium">
              Total applications
            </span>
          </div>
          <div className="text-[40px] font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] mt-2.5 leading-none">
            <AnimatedNumber value={totalCount} />
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="apple-card p-5 transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0A84FF] shrink-0" />
            <span className="text-[13px] text-[#86868B] dark:text-[#8E8E93] font-medium">
              Active pipeline
            </span>
          </div>
          <div className="text-[40px] font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] mt-2.5 leading-none">
            <AnimatedNumber value={activeCount} />
          </div>
        </div>

        {/* Card 3: Interviews */}
        <div className="apple-card p-5 transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#BF5AF2] shrink-0" />
            <span className="text-[13px] text-[#86868B] dark:text-[#8E8E93] font-medium">
              Interviews
            </span>
          </div>
          <div className="text-[40px] font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] mt-2.5 leading-none">
            <AnimatedNumber value={interviewCount} />
          </div>
        </div>

        {/* Card 4: Selected (Offers) */}
        <div className="apple-card p-5 transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#30D158] shrink-0" />
            <span className="text-[13px] text-[#86868B] dark:text-[#8E8E93] font-medium">
              Offers &amp; Selected
            </span>
          </div>
          <div className="text-[40px] font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] mt-2.5 leading-none">
            <AnimatedNumber value={selectedCount} />
          </div>
        </div>
      </div>

      {/* 2 Charts: Applications over 8 weeks & Stage breakdown */}
      <DashboardCharts applications={applications} />

      {/* Lists Below: Upcoming Reminders (next 3) & Recent Applications (last 5) with hairline separators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Upcoming Reminders (next 3) */}
        <div className="apple-card overflow-hidden transition-colors flex flex-col justify-between">
          <div className="p-5 pb-3 flex items-center justify-between border-b border-[#E5E5EA] dark:border-[#38383A]">
            <h4 className="font-bold text-[17px] text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
              Upcoming reminders
            </h4>
            <Link
              to="/reminders"
              className="text-[13px] font-medium text-[#0A84FF] hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#E5E5EA] dark:divide-[#38383A] flex-1">
            {next3Reminders.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-[#86868B] dark:text-[#8E8E93]">
                <p>No upcoming reminders</p>
              </div>
            ) : (
              next3Reminders.map((rem) => {
                const remDate = new Date(rem.remind_at);
                const isOverdue = isPast(remDate);
                const timeText = formatDistanceToNow(remDate, { addSuffix: true });

                return (
                  <div
                    key={rem.id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-[#F2F2F7]/50 dark:hover:bg-[#2C2C2E]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleReminder(rem.id, true)}
                        className="w-5 h-5 rounded-full border border-[#86868B] dark:border-[#8E8E93] hover:border-[#30D158] hover:bg-[#30D158]/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Mark as done"
                        aria-label="Mark done"
                      >
                        <Check className="w-3 h-3 text-transparent hover:text-[#30D158]" />
                      </button>
                      <div className="min-w-0">
                        <p className="text-[15px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                          {rem.title}
                        </p>
                        {rem.applications && (
                          <p className="text-[13px] text-[#86868B] dark:text-[#8E8E93] truncate">
                            {rem.applications.company_name} &bull; {rem.applications.role}
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[12px] shrink-0 font-medium ${
                        isOverdue ? 'text-[#FF453A]' : 'text-[#86868B] dark:text-[#8E8E93]'
                      }`}
                    >
                      {timeText}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Card: Recent Applications (last 5) */}
        <div className="apple-card overflow-hidden transition-colors flex flex-col justify-between">
          <div className="p-5 pb-3 flex items-center justify-between border-b border-[#E5E5EA] dark:border-[#38383A]">
            <h4 className="font-bold text-[17px] text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
              Recent applications
            </h4>
            <Link
              to="/applications"
              className="text-[13px] font-medium text-[#0A84FF] hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#E5E5EA] dark:divide-[#38383A] flex-1">
            {recent5Apps.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-[#86868B] dark:text-[#8E8E93]">
                <p>No applications logged yet</p>
              </div>
            ) : (
              recent5Apps.map((app) => {
                const avatar = getCompanyAvatarInfo(app.company_name);
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedDrawerApp(app)}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-[#F2F2F7]/50 dark:hover:bg-[#2C2C2E]/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatar.classes}`}
                      >
                        {avatar.initial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                          {app.company_name}
                        </p>
                        <p className="text-[13px] text-[#86868B] dark:text-[#8E8E93] truncate">
                          {app.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="stage" stage={app.stage} size="sm" />
                      <ChevronRight className="w-4 h-4 text-[#86868B] dark:text-[#8E8E93]" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Application Detail Drawer */}
      <ApplicationDrawer
        application={selectedDrawerApp}
        isOpen={Boolean(selectedDrawerApp)}
        onClose={() => setSelectedDrawerApp(null)}
        onEdit={(app) => {
          setSelectedDrawerApp(null);
          setEditingApp(app);
          setIsEditModalOpen(true);
        }}
        onDelete={async (app) => {
          setSelectedDrawerApp(null);
          await deleteApplication(app.id);
        }}
        onAddReminder={(appId) => {
          setIsReminderModalOpen(true);
        }}
        onStageChange={async (id, stage) => {
          await moveStage(id, stage);
        }}
      />

      {/* Edit Modal */}
      <ApplicationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingApp(null);
        }}
        applicationToEdit={editingApp}
      />

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        preselectedAppId={selectedDrawerApp?.id}
      />
    </div>
  );
};
