export type Stage =
  | 'saved'
  | 'applied'
  | 'assessment'
  | 'interview'
  | 'selected'
  | 'rejected';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface UserSettings {
  user_id: string;
  theme: ThemePreference;
  browser_notifications: boolean;
}

export interface Resume {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  size_bytes: number | null;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  company_name: string;
  role: string;
  ctc: string | null;
  location: string | null;
  job_type: string | null;
  source: string | null;
  link: string | null;
  applied_date: string | null;
  stage: Stage;
  resume_id: string | null;
  notes: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  // joined relations when querying
  resumes?: Resume | null;
}

export interface StageHistory {
  id: string;
  application_id: string;
  user_id: string;
  from_stage: Stage | null;
  to_stage: Stage;
  changed_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  application_id: string | null;
  title: string;
  description: string | null;
  remind_at: string;
  is_done: boolean;
  notified: boolean;
  created_at: string;
  // optional joined application details
  applications?: Pick<Application, 'id' | 'company_name' | 'role' | 'stage'> | null;
}

export interface StageConfig {
  id: Stage;
  label: string;
  dotColor: string;
  pillBgLight: string;
  pillTextLight: string;
  pillBgDark: string;
  pillTextDark: string;
  badgeBgLight?: string;
  badgeTextLight?: string;
  badgeBgDark?: string;
  badgeTextDark?: string;
  borderLight?: string;
  borderDark?: string;
}

export const STAGES_CONFIG: Record<Stage, StageConfig> = {
  saved: {
    id: 'saved',
    label: 'Saved',
    dotColor: '#8E8E93',
    pillBgLight: 'bg-[#8E8E93]/12',
    pillTextLight: 'text-[#636366]',
    pillBgDark: 'dark:bg-[#8E8E93]/20',
    pillTextDark: 'dark:text-[#AEAEB2]',
    badgeBgLight: 'bg-[#8E8E93]/12',
    badgeTextLight: 'text-[#636366]',
    badgeBgDark: 'dark:bg-[#8E8E93]/20',
    badgeTextDark: 'dark:text-[#AEAEB2]',
    borderLight: 'border-[#8E8E93]/30',
    borderDark: 'dark:border-[#8E8E93]/40',
  },
  applied: {
    id: 'applied',
    label: 'Applied',
    dotColor: '#0A84FF',
    pillBgLight: 'bg-[#0A84FF]/12',
    pillTextLight: 'text-[#0066CC]',
    pillBgDark: 'dark:bg-[#0A84FF]/20',
    pillTextDark: 'dark:text-[#64D2FF]',
    badgeBgLight: 'bg-[#0A84FF]/12',
    badgeTextLight: 'text-[#0066CC]',
    badgeBgDark: 'dark:bg-[#0A84FF]/20',
    badgeTextDark: 'dark:text-[#64D2FF]',
    borderLight: 'border-[#0A84FF]/30',
    borderDark: 'dark:border-[#0A84FF]/40',
  },
  assessment: {
    id: 'assessment',
    label: 'Assessment',
    dotColor: '#FF9F0A',
    pillBgLight: 'bg-[#FF9F0A]/14',
    pillTextLight: 'text-[#C97800]',
    pillBgDark: 'dark:bg-[#FF9F0A]/20',
    pillTextDark: 'dark:text-[#FFD60A]',
    badgeBgLight: 'bg-[#FF9F0A]/14',
    badgeTextLight: 'text-[#C97800]',
    badgeBgDark: 'dark:bg-[#FF9F0A]/20',
    badgeTextDark: 'dark:text-[#FFD60A]',
    borderLight: 'border-[#FF9F0A]/30',
    borderDark: 'dark:border-[#FF9F0A]/40',
  },
  interview: {
    id: 'interview',
    label: 'Interview',
    dotColor: '#BF5AF2',
    pillBgLight: 'bg-[#BF5AF2]/14',
    pillTextLight: 'text-[#9A38D4]',
    pillBgDark: 'dark:bg-[#BF5AF2]/20',
    pillTextDark: 'dark:text-[#DA8FFF]',
    badgeBgLight: 'bg-[#BF5AF2]/14',
    badgeTextLight: 'text-[#9A38D4]',
    badgeBgDark: 'dark:bg-[#BF5AF2]/20',
    badgeTextDark: 'dark:text-[#DA8FFF]',
    borderLight: 'border-[#BF5AF2]/30',
    borderDark: 'dark:border-[#BF5AF2]/40',
  },
  selected: {
    id: 'selected',
    label: 'Selected',
    dotColor: '#30D158',
    pillBgLight: 'bg-[#30D158]/14',
    pillTextLight: 'text-[#1E8A38]',
    pillBgDark: 'dark:bg-[#30D158]/20',
    pillTextDark: 'dark:text-[#70FF94]',
    badgeBgLight: 'bg-[#30D158]/14',
    badgeTextLight: 'text-[#1E8A38]',
    badgeBgDark: 'dark:bg-[#30D158]/20',
    badgeTextDark: 'dark:text-[#70FF94]',
    borderLight: 'border-[#30D158]/30',
    borderDark: 'dark:border-[#30D158]/40',
  },
  rejected: {
    id: 'rejected',
    label: 'Rejected',
    dotColor: '#FF453A',
    pillBgLight: 'bg-[#FF453A]/12',
    pillTextLight: 'text-[#D70015]',
    pillBgDark: 'dark:bg-[#FF453A]/20',
    pillTextDark: 'dark:text-[#FF6961]',
    badgeBgLight: 'bg-[#FF453A]/12',
    badgeTextLight: 'text-[#D70015]',
    badgeBgDark: 'dark:bg-[#FF453A]/20',
    badgeTextDark: 'dark:text-[#FF6961]',
    borderLight: 'border-[#FF453A]/30',
    borderDark: 'dark:border-[#FF453A]/40',
  },
};
