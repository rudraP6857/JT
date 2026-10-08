import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Application, Reminder, Resume, Stage, StageHistory } from '../types/index.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { useAuth } from './AuthContext.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import {
  INITIAL_MOCK_APPLICATIONS,
  INITIAL_MOCK_REMINDERS,
  INITIAL_MOCK_RESUMES,
  INITIAL_MOCK_HISTORY,
} from '../services/mockData.ts';

interface JobTrackerContextType {
  applications: Application[];
  resumes: Resume[];
  reminders: Reminder[];
  stageHistory: StageHistory[];
  isLoading: boolean;
  createApplication: (app: Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'position' | 'resumes'>) => Promise<void>;
  updateApplication: (id: string, updates: Partial<Application>) => Promise<void>;
  updateStage: (id: string, newStage: Stage) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  uploadResume: (file: File) => Promise<Resume | null>;
  deleteResume: (id: string) => Promise<void>;
  getResumeUrl: (filePath: string) => Promise<string | null>;
  createReminder: (reminder: { application_id?: string | null; title: string; description?: string; remind_at: string }) => Promise<void>;
  toggleReminder: (id: string, is_done: boolean) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const JobTrackerContext = createContext<JobTrackerContextType | undefined>(undefined);

export const JobTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [applications, setApplications] = useState<Application[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [stageHistory, setStageHistory] = useState<StageHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all user records from Supabase
  const fetchData = useCallback(async () => {
    if (!user) {
      setApplications([]);
      setResumes([]);
      setReminders([]);
      setStageHistory([]);
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setApplications([]);
      setResumes([]);
      setReminders([]);
      setStageHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch Resumes
      const { data: resumesData, error: resumesErr } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (resumesErr) throw resumesErr;

      // Fetch Applications with joined resumes
      const { data: appsData, error: appsErr } = await supabase
        .from('applications')
        .select('*, resumes(*)')
        .eq('user_id', user.id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (appsErr) throw appsErr;

      // Fetch Reminders with joined application titles
      const { data: remindersData, error: remErr } = await supabase
        .from('reminders')
        .select('*, applications(id, company_name, role, stage)')
        .eq('user_id', user.id)
        .order('remind_at', { ascending: true });

      if (remErr) throw remErr;

      // Fetch Stage History
      const { data: historyData, error: histErr } = await supabase
        .from('stage_history')
        .select('*')
        .eq('user_id', user.id)
        .order('changed_at', { ascending: false });

      if (histErr) throw histErr;

      setResumes(resumesData || []);
      setApplications(appsData || []);
      setReminders(remindersData || []);
      setStageHistory(historyData || []);
    } catch (err: any) {
      console.error('Failed to fetch data from Supabase:', err);
      toastError('Connection Error', err?.message || 'Unable to sync with Supabase');
    } finally {
      setIsLoading(false);
    }
  }, [user, toastError]);

  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Supabase Realtime subscriptions
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    const channelName = `schema-changes-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${user.id}` },
        () => {
          fetchDataRef.current();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reminders', filter: `user_id=eq.${user.id}` },
        () => {
          fetchDataRef.current();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Create Application
  const createApplication = async (
    appData: Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'position' | 'resumes'>
  ) => {
    if (!user) return;

    if (!isSupabaseConfigured) {
      const newId = `app-${Date.now()}`;
      const matchingResume = resumes.find((r) => r.id === appData.resume_id) || null;
      const newApp: Application = {
        ...appData,
        id: newId,
        user_id: user.id,
        position: applications.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        resumes: matchingResume,
      };

      setApplications((prev) => [newApp, ...prev]);

      // Stage history entry
      const hist: StageHistory = {
        id: `hist-${Date.now()}`,
        application_id: newId,
        user_id: user.id,
        from_stage: null,
        to_stage: appData.stage,
        changed_at: new Date().toISOString(),
      };
      setStageHistory((prev) => [hist, ...prev]);

      success('Application added', `${appData.role} at ${appData.company_name}`);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          company_name: appData.company_name,
          role: appData.role,
          ctc: appData.ctc || null,
          location: appData.location || null,
          job_type: appData.job_type || null,
          source: appData.source || null,
          link: appData.link || null,
          applied_date: appData.applied_date || null,
          stage: appData.stage,
          resume_id: appData.resume_id || null,
          notes: appData.notes || null,
          position: applications.length,
        })
        .select('*, resumes(*)')
        .single();

      if (error) throw error;
      setApplications((prev) => [data, ...prev]);
      success('Application tracked', `${appData.role} at ${appData.company_name}`);
    } catch (err: any) {
      console.error('Failed to create application:', err);
      toastError('Could not save application', err.message);
    }
  };

  // Update Application
  const updateApplication = async (id: string, updates: Partial<Application>) => {
    if (!user) return;

    if (!isSupabaseConfigured) {
      setApplications((prev) =>
        prev.map((app) => {
          if (app.id === id) {
            const updatedResume = updates.resume_id
              ? resumes.find((r) => r.id === updates.resume_id) || null
              : app.resumes;
            return {
              ...app,
              ...updates,
              resumes: updatedResume,
              updated_at: new Date().toISOString(),
            };
          }
          return app;
        })
      );
      success('Application updated');
      return;
    }

    try {
      const { error } = await supabase
        .from('applications')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchData();
      success('Application updated');
    } catch (err: any) {
      console.error('Failed to update application:', err);
      toastError('Update failed', err.message);
    }
  };

  // Update Stage (Drag & Drop or Quick Move)
  const updateStage = async (id: string, newStage: Stage) => {
    if (!user) return;

    const currentApp = applications.find((a) => a.id === id);
    if (!currentApp || currentApp.stage === newStage) return;

    const oldStage = currentApp.stage;

    // Optimistic update
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, stage: newStage, updated_at: new Date().toISOString() } : app))
    );

    if (!isSupabaseConfigured) {
      const newHist: StageHistory = {
        id: `hist-${Date.now()}`,
        application_id: id,
        user_id: user.id,
        from_stage: oldStage,
        to_stage: newStage,
        changed_at: new Date().toISOString(),
      };
      setStageHistory((prev) => [newHist, ...prev]);
      success('Stage progressed', `Moved to ${newStage.toUpperCase()}`);
      return;
    }

    try {
      const { error } = await supabase
        .from('applications')
        .update({ stage: newStage, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      success('Stage progressed', `Moved to ${newStage.toUpperCase()}`);
    } catch (err: any) {
      console.error('Stage update failed:', err);
      toastError('Stage change failed', err.message);
      // Revert optimistic update
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, stage: oldStage } : app))
      );
    }
  };

  // Delete Application
  const deleteApplication = async (id: string) => {
    if (!user) return;

    if (!isSupabaseConfigured) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setReminders((prev) => prev.filter((r) => r.application_id !== id));
      success('Application removed');
      return;
    }

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setApplications((prev) => prev.filter((a) => a.id !== id));
      success('Application removed');
    } catch (err: any) {
      console.error('Failed to delete application:', err);
      toastError('Delete failed', err.message);
    }
  };

  // Upload Resume to Supabase Storage (PDF only, max 5MB)
  const uploadResume = async (file: File): Promise<Resume | null> => {
    if (!user) return null;

    if (file.type !== 'application/pdf') {
      toastError('Invalid file format', 'Only PDF resumes are supported');
      return null;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
    if (file.size > MAX_SIZE) {
      toastError('File too large', 'Resume size must be under 5MB');
      return null;
    }

    if (!isSupabaseConfigured) {
      const newResume: Resume = {
        id: `res-${Date.now()}`,
        user_id: user.id,
        name: file.name,
        file_path: `${user.id}/${file.name}`,
        size_bytes: file.size,
        created_at: new Date().toISOString(),
      };
      setResumes((prev) => [newResume, ...prev]);
      success('Resume uploaded', file.name);
      return newResume;
    }

    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${user.id}/${Date.now()}_${sanitizedName}`;

      // Upload to private Supabase Storage bucket 'resumes'
      const { error: uploadErr } = await supabase.storage
        .from('resumes')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/pdf',
        });

      if (uploadErr) {
        if (uploadErr.message?.includes('Bucket not found') || (uploadErr as any).statusCode === '404') {
          toastError(
            'Bucket "resumes" Missing',
            'Please create a private bucket named "resumes" in your Supabase Dashboard -> Storage'
          );
          return null;
        }
        throw uploadErr;
      }

      // Insert record into 'resumes' table
      const { data, error: dbErr } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          name: file.name,
          file_path: storagePath,
          size_bytes: file.size,
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      setResumes((prev) => [data, ...prev]);
      success('Resume uploaded', file.name);
      return data;
    } catch (err: any) {
      console.error('Resume upload failed:', err);
      toastError('Resume upload failed', err.message);
      return null;
    }
  };

  // Delete Resume
  const deleteResume = async (id: string) => {
    if (!user) return;
    const target = resumes.find((r) => r.id === id);
    if (!target) return;

    if (!isSupabaseConfigured) {
      setResumes((prev) => prev.filter((r) => r.id !== id));
      success('Resume deleted');
      return;
    }

    try {
      // Delete from storage
      await supabase.storage.from('resumes').remove([target.file_path]);

      // Delete from database
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setResumes((prev) => prev.filter((r) => r.id !== id));
      success('Resume deleted');
    } catch (err: any) {
      console.error('Resume deletion failed:', err);
      toastError('Delete failed', err.message);
    }
  };

  // Generate signed temporary download/view URL
  const getResumeUrl = async (filePath: string): Promise<string | null> => {
    if (!isSupabaseConfigured) {
      return '#';
    }

    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(filePath, 3600); // 1 hour

      if (error) throw error;
      return data.signedUrl;
    } catch (err) {
      console.error('Error generating signed URL for resume:', err);
      return null;
    }
  };

  // Create Reminder
  const createReminder = async (item: {
    application_id?: string | null;
    title: string;
    description?: string;
    remind_at: string;
  }) => {
    if (!user) return;

    if (!isSupabaseConfigured) {
      const app = item.application_id
        ? applications.find((a) => a.id === item.application_id)
        : null;

      const newRem: Reminder = {
        id: `rem-${Date.now()}`,
        user_id: user.id,
        application_id: item.application_id || null,
        title: item.title,
        description: item.description || null,
        remind_at: item.remind_at,
        is_done: false,
        notified: false,
        created_at: new Date().toISOString(),
        applications: app
          ? {
              id: app.id,
              company_name: app.company_name,
              role: app.role,
              stage: app.stage,
            }
          : null,
      };

      setReminders((prev) => [...prev, newRem].sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()));
      success('Reminder set', item.title);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert({
          user_id: user.id,
          application_id: item.application_id || null,
          title: item.title,
          description: item.description || null,
          remind_at: item.remind_at,
          is_done: false,
          notified: false,
        })
        .select('*, applications(id, company_name, role, stage)')
        .single();

      if (error) throw error;
      setReminders((prev) => [...prev, data].sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()));
      success('Reminder created', item.title);
    } catch (err: any) {
      console.error('Failed to create reminder:', err);
      toastError('Could not set reminder', err.message);
    }
  };

  // Toggle Reminder is_done
  const toggleReminder = async (id: string, is_done: boolean) => {
    if (!user) return;

    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_done } : r))
    );

    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_done })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to toggle reminder:', err);
      toastError('Update failed', err.message);
    }
  };

  // Delete Reminder
  const deleteReminder = async (id: string) => {
    if (!user) return;

    setReminders((prev) => prev.filter((r) => r.id !== id));

    if (!isSupabaseConfigured) {
      success('Reminder removed');
      return;
    }

    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      success('Reminder removed');
    } catch (err: any) {
      console.error('Failed to delete reminder:', err);
      toastError('Delete failed', err.message);
    }
  };

  return (
    <JobTrackerContext.Provider
      value={{
        applications,
        resumes,
        reminders,
        stageHistory,
        isLoading,
        createApplication,
        updateApplication,
        updateStage,
        deleteApplication,
        uploadResume,
        deleteResume,
        getResumeUrl,
        createReminder,
        toggleReminder,
        deleteReminder,
        refreshData: fetchData,
      }}
    >
      {children}
    </JobTrackerContext.Provider>
  );
};

export const useJobTracker = () => {
  const context = useContext(JobTrackerContext);
  if (!context) {
    throw new Error('useJobTracker must be used within a JobTrackerProvider');
  }
  return context;
};
