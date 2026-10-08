import { useState, useEffect, useCallback, useRef } from 'react';
import { Application, Stage } from '../types/index.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import { INITIAL_MOCK_APPLICATIONS } from '../services/mockData.ts';

export type CreateApplicationInput = Omit<
  Application,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'position' | 'resumes'
>;

export type UpdateApplicationInput = Partial<CreateApplicationInput>;

export function useApplications() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep a reference to current applications for rollbacks
  const appsRef = useRef<Application[]>([]);
  appsRef.current = applications;

  // 1. Fetch Applications
  const fetchApplications = useCallback(async () => {
    if (!user) {
      setApplications([]);
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setApplications([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('applications')
        .select('*, resumes(id, name, file_path)')
        .eq('user_id', user.id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      setApplications(data || []);
    } catch (err: any) {
      console.error('Error fetching applications from Supabase:', err);
      const msg = err.message || 'Failed to load applications';
      setError(msg);
      toastError('Connection Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [user, toastError]);

  const fetchApplicationsRef = useRef(fetchApplications);
  fetchApplicationsRef.current = fetchApplications;

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // 2. Realtime Subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    // Use a unique channel name per hook instance to prevent collision or double subscription
    const channelName = `apps-rt-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchApplicationsRef.current();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // 3. Create Application (with optimistic update)
  const createApplication = async (input: CreateApplicationInput) => {
    if (!user) return null;

    const tempId = `temp-${Date.now()}`;
    const optimisticApp: Application = {
      ...input,
      id: tempId,
      user_id: user.id,
      position: applications.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resumes: null,
    };

    // Optimistically prepend to state
    setApplications((prev) => [optimisticApp, ...prev]);

    if (!isSupabaseConfigured) {
      success('Application tracked', `${input.role} at ${input.company_name}`);
      return optimisticApp;
    }

    try {
      const { data, error: insertErr } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          company_name: input.company_name.trim(),
          role: input.role.trim(),
          ctc: input.ctc?.trim() || null,
          location: input.location?.trim() || null,
          job_type: input.job_type || null,
          source: input.source || null,
          link: input.link?.trim() || null,
          applied_date: input.applied_date || null,
          stage: input.stage || 'saved',
          resume_id: input.resume_id || null,
          notes: input.notes?.trim() || null,
          position: applications.length,
        })
        .select('*, resumes(id, name, file_path)')
        .single();

      if (insertErr) throw insertErr;

      // Replace optimistic row with confirmed DB row
      setApplications((prev) =>
        prev.map((app) => (app.id === tempId ? data : app))
      );

      success('Application saved', `${input.role} at ${input.company_name}`);
      return data;
    } catch (err: any) {
      console.error('Failed to create application:', err);
      // Rollback optimistic update
      setApplications((prev) => prev.filter((app) => app.id !== tempId));
      toastError('Save failed', err.message || 'Could not save application');
      throw err;
    }
  };

  // 4. Update Application (with optimistic update and rollback)
  const updateApplication = async (id: string, updates: UpdateApplicationInput) => {
    if (!user) return;

    const previousApps = [...appsRef.current];
    const target = previousApps.find((a) => a.id === id);
    if (!target) return;

    // Optimistic update
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              ...updates,
              updated_at: new Date().toISOString(),
            }
          : app
      )
    );

    if (!isSupabaseConfigured) {
      success('Changes saved', `${updates.company_name || target.company_name}`);
      return;
    }

    try {
      const { data, error: updateErr } = await supabase
        .from('applications')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*, resumes(id, name, file_path)')
        .single();

      if (updateErr) throw updateErr;

      // Ensure state is updated with fresh data
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? data : app))
      );

      success('Application updated');
    } catch (err: any) {
      console.error('Failed to update application:', err);
      // Rollback on error
      setApplications(previousApps);
      toastError('Update failed', err.message || 'Could not update application');
      throw err;
    }
  };

  // 5. Delete Application (with optimistic update and rollback)
  const deleteApplication = async (id: string) => {
    if (!user) return;

    const previousApps = [...appsRef.current];
    const target = previousApps.find((a) => a.id === id);
    if (!target) return;

    // Optimistically remove
    setApplications((prev) => prev.filter((app) => app.id !== id));

    if (!isSupabaseConfigured) {
      success('Application deleted', `${target.company_name} removed`);
      return;
    }

    try {
      const { error: deleteErr } = await supabase
        .from('applications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteErr) throw deleteErr;

      success('Application removed', `${target.company_name} was deleted`);
    } catch (err: any) {
      console.error('Failed to delete application:', err);
      // Rollback on error
      setApplications(previousApps);
      toastError('Delete failed', err.message || 'Could not delete application');
      throw err;
    }
  };

  // 6. Move Stage (with optimistic update and rollback)
  const moveStage = async (id: string, toStage: Stage) => {
    if (!user) return;

    const previousApps = [...appsRef.current];
    const target = previousApps.find((a) => a.id === id);
    if (!target || target.stage === toStage) return;

    // Optimistically update stage
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              stage: toStage,
              updated_at: new Date().toISOString(),
            }
          : app
      )
    );

    if (!isSupabaseConfigured) {
      success('Stage progressed', `Moved ${target.company_name} to ${toStage.toUpperCase()}`);
      return;
    }

    try {
      const { data, error: stageErr } = await supabase
        .from('applications')
        .update({
          stage: toStage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*, resumes(id, name, file_path)')
        .single();

      if (stageErr) throw stageErr;

      setApplications((prev) =>
        prev.map((app) => (app.id === id ? data : app))
      );

      success('Stage updated', `Moved to ${toStage.toUpperCase()}`);
    } catch (err: any) {
      console.error('Failed to move stage:', err);
      // Rollback
      setApplications(previousApps);
      toastError('Stage change failed', err.message || 'Could not update stage');
    }
  };

  // 7. Duplicate Application
  const duplicateApplication = async (sourceApp: Application) => {
    if (!user) return;

    return await createApplication({
      company_name: `${sourceApp.company_name} (Copy)`,
      role: sourceApp.role,
      ctc: sourceApp.ctc,
      location: sourceApp.location,
      job_type: sourceApp.job_type,
      source: sourceApp.source,
      link: sourceApp.link,
      applied_date: sourceApp.applied_date,
      stage: sourceApp.stage,
      resume_id: sourceApp.resume_id,
      notes: sourceApp.notes,
    });
  };

  return {
    applications,
    isLoading,
    error,
    createApplication,
    updateApplication,
    deleteApplication,
    moveStage,
    duplicateApplication,
    refetch: fetchApplications,
  };
}
