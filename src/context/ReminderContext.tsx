import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Reminder } from '../types/index.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { useAuth } from './AuthContext.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import { INITIAL_MOCK_REMINDERS } from '../services/mockData.ts';

interface ReminderContextType {
  reminders: Reminder[];
  isLoading: boolean;
  dueReminders: Reminder[];
  unreadNotificationCount: number;
  browserNotificationsEnabled: boolean;
  createReminder: (data: {
    application_id?: string | null;
    title: string;
    description?: string | null;
    remind_at: string;
  }) => Promise<Reminder | null>;
  updateReminder: (
    id: string,
    updates: Partial<Pick<Reminder, 'title' | 'description' | 'remind_at' | 'application_id' | 'is_done'>>
  ) => Promise<void>;
  snoozeReminder: (id: string, hours?: number) => Promise<void>;
  toggleReminder: (id: string, is_done: boolean) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  markAllDueAsDone: () => Promise<void>;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  refetchReminders: () => Promise<void>;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const ReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast, success, error: toastError } = useToast();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);

  const remindersRef = useRef<Reminder[]>([]);
  remindersRef.current = reminders;

  // 1. Fetch initial reminders and check user_settings
  const fetchReminders = useCallback(async () => {
    if (!user) {
      setReminders([]);
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setReminders([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('reminders')
        .select('*, applications(id, company_name, role, stage)')
        .eq('user_id', user.id)
        .order('remind_at', { ascending: true });

      if (error) throw error;

      setReminders(data || []);

      // Check notification preference from user_settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('browser_notifications')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsData?.browser_notifications) {
        setBrowserNotificationsEnabled(true);
      }
    } catch (err: any) {
      console.error('Error fetching reminders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchRemindersRef = useRef(fetchReminders);
  fetchRemindersRef.current = fetchReminders;

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // 2. Realtime subscription on `reminders` table
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    // Unique channel per mount prevents double subscription collisions
    const channelName = `reminders-rt-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reminders',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchRemindersRef.current();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // 3. Due reminders computation (due/overdue & not done)
  const dueReminders = reminders.filter(
    (r) => !r.is_done && new Date(r.remind_at).getTime() <= Date.now()
  );

  const unreadNotificationCount = dueReminders.length;

  // 4. Notification Engine: check every 30 seconds & on tab visibility change
  const checkDueReminders = useCallback(async () => {
    if (!user) return;
    const now = Date.now();
    const currentList = remindersRef.current;

    for (const rem of currentList) {
      const remindTime = new Date(rem.remind_at).getTime();

      // Find reminders where remind_at <= now, is_done = false, notified = false
      if (remindTime <= now && !rem.is_done && !rem.notified) {
        // Mark locally to prevent repeated firing
        rem.notified = true;

        // In-app toast with Snooze & Mark Done actions
        showToast(
          'warning',
          `Reminder Due: ${rem.title}`,
          rem.description || rem.applications?.company_name
            ? `For ${rem.applications?.company_name || ''} ${rem.description ? `• ${rem.description}` : ''}`
            : 'Scheduled deadline has arrived',
          8000,
          {
            label: 'Snooze 1h',
            onClick: () => snoozeReminder(rem.id, 1),
          }
        );

        // Browser Native Notification
        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          try {
            new Notification(`StatusHired: ${rem.title}`, {
              body: rem.description || `Deadline arrived for ${rem.applications?.company_name || 'your application'}`,
              icon: '/favicon.ico',
            });
          } catch {
            // notification error fallback
          }
        }

        // Persist notified = true in Supabase so other tabs or devices don't re-notify
        if (isSupabaseConfigured) {
          supabase
            .from('reminders')
            .update({ notified: true })
            .eq('id', rem.id)
            .eq('user_id', user.id)
            .then();
        }
      }
    }
  }, [user, false, showToast]);

  useEffect(() => {
    // Run interval every 30 seconds
    const interval = setInterval(checkDueReminders, 30000);

    // Run on tab visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkDueReminders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Initial check after mount
    const timeout = setTimeout(checkDueReminders, 2000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimeout(timeout);
    };
  }, [checkDueReminders]);

  // 5. Create Reminder
  const createReminder = async (data: {
    application_id?: string | null;
    title: string;
    description?: string | null;
    remind_at: string;
  }): Promise<Reminder | null> => {
    if (!user) return null;

    if (!isSupabaseConfigured) {
      const newRem: Reminder = {
        id: `rem-${Date.now()}`,
        user_id: user.id,
        application_id: data.application_id || null,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        remind_at: data.remind_at,
        is_done: false,
        notified: false,
        created_at: new Date().toISOString(),
      };
      setReminders((prev) => [...prev, newRem].sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()));
      success('Reminder created', data.title);
      return newRem;
    }

    try {
      const { data: created, error } = await supabase
        .from('reminders')
        .insert({
          user_id: user.id,
          application_id: data.application_id || null,
          title: data.title.trim(),
          description: data.description?.trim() || null,
          remind_at: data.remind_at,
          is_done: false,
          notified: false,
        })
        .select('*, applications(id, company_name, role, stage)')
        .single();

      if (error) throw error;

      setReminders((prev) => [...prev, created].sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()));
      success('Reminder set', data.title);
      return created;
    } catch (err: any) {
      console.error('Failed to create reminder:', err);
      toastError('Error', err.message || 'Could not create reminder');
      throw err;
    }
  };

  // 6. Update Reminder
  const updateReminder = async (
    id: string,
    updates: Partial<Pick<Reminder, 'title' | 'description' | 'remind_at' | 'application_id' | 'is_done'>>
  ) => {
    if (!user) return;

    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, notified: false } : r))
    );

    if (!isSupabaseConfigured) {
      success('Reminder updated');
      return;
    }

    try {
      const { error } = await supabase
        .from('reminders')
        .update({ ...updates, notified: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      success('Reminder updated');
    } catch (err: any) {
      console.error('Failed to update reminder:', err);
      toastError('Update failed', err.message);
    }
  };

  // 7. Snooze Reminder (+1 hour)
  const snoozeReminder = async (id: string, hours = 1) => {
    if (!user) return;
    const newRemindAt = new Date(Date.now() + hours * 3600000).toISOString();

    setReminders((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, remind_at: newRemindAt, notified: false } : r
      )
    );

    if (isSupabaseConfigured && !false) {
      await supabase
        .from('reminders')
        .update({ remind_at: newRemindAt, notified: false })
        .eq('id', id)
        .eq('user_id', user.id);
    }

    success('Snoozed', `Postponed by ${hours} hour${hours > 1 ? 's' : ''}`);
  };

  // 8. Toggle is_done
  const toggleReminder = async (id: string, is_done: boolean) => {
    if (!user) return;

    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_done } : r))
    );

    if (isSupabaseConfigured && !false) {
      await supabase
        .from('reminders')
        .update({ is_done })
        .eq('id', id)
        .eq('user_id', user.id);
    }
  };

  // 9. Delete Reminder
  const deleteReminder = async (id: string) => {
    if (!user) return;

    setReminders((prev) => prev.filter((r) => r.id !== id));

    if (isSupabaseConfigured && !false) {
      await supabase
        .from('reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    }

    success('Reminder removed');
  };

  // 10. Mark all due as done
  const markAllDueAsDone = async () => {
    if (!user || dueReminders.length === 0) return;

    const dueIds = dueReminders.map((d) => d.id);

    setReminders((prev) =>
      prev.map((r) => (dueIds.includes(r.id) ? { ...r, is_done: true } : r))
    );

    if (isSupabaseConfigured && !false) {
      await supabase
        .from('reminders')
        .update({ is_done: true })
        .in('id', dueIds)
        .eq('user_id', user.id);
    }

    success('Marked done', `Cleared ${dueIds.length} due task${dueIds.length > 1 ? 's' : ''}`);
  };

  // 11. Request Notification Permission & persist in user_settings
  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toastError('Not supported', 'Browser does not support desktop notifications');
      return 'denied';
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      setBrowserNotificationsEnabled(true);
      if (user && isSupabaseConfigured && !false) {
        await supabase
          .from('user_settings')
          .upsert({ user_id: user.id, browser_notifications: true }, { onConflict: 'user_id' });
      }
      success('Notifications enabled', 'You will receive reminders when deadlines arrive');
    } else if (permission === 'denied') {
      setBrowserNotificationsEnabled(false);
      toastError('Permission denied', 'Please unblock notifications in your browser site settings');
    }

    return permission;
  };

  return (
    <ReminderContext.Provider
      value={{
        reminders,
        isLoading,
        dueReminders,
        unreadNotificationCount,
        browserNotificationsEnabled,
        createReminder,
        updateReminder,
        snoozeReminder,
        toggleReminder,
        deleteReminder,
        markAllDueAsDone,
        requestNotificationPermission,
        refetchReminders: fetchReminders,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminderEngine = () => {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminderEngine must be used within a ReminderProvider');
  }
  return context;
};
