import { useState, useEffect, useCallback, useRef } from 'react';
import { Resume } from '../types/index.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import { INITIAL_MOCK_RESUMES } from '../services/mockData.ts';

export function useResumes() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const resumesRef = useRef<Resume[]>([]);
  resumesRef.current = resumes;

  // 1. Fetch Resumes from `resumes` table
  const fetchResumes = useCallback(async () => {
    if (!user) {
      setResumes([]);
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setResumes([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      setResumes(data || []);
    } catch (err: any) {
      console.error('Error fetching resumes:', err);
      const msg = err.message || 'Failed to load resumes';
      setError(msg);
      toastError('Connection Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [user, toastError]);

  const fetchResumesRef = useRef(fetchResumes);
  fetchResumesRef.current = fetchResumes;

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  // Realtime subscription on `resumes` table
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    // Use a unique channel name per hook instance to prevent collision or double subscription
    const channelName = `resumes-rt-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resumes',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchResumesRef.current();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // 2. Upload Resume: PDF validation, max 5MB, upload to path `${user.id}/${uuid}-${safeName}`, insert to DB
  const uploadResume = async (file: File, customName?: string): Promise<Resume> => {
    if (!user) {
      throw new Error('You must be signed in to upload a resume');
    }

    // Validation: PDF only
    if (file.type !== 'application/pdf') {
      const err = new Error('Only PDF resumes are supported');
      toastError('Invalid format', 'Only PDF resumes are supported');
      throw err;
    }

    // Validation: Max 5MB
    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      const err = new Error('File exceeds the 5MB size limit');
      toastError('File too large', 'Resume size must be under 5MB');
      throw err;
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueId = crypto.randomUUID();
    const filePath = `${user.id}/${uniqueId}-${safeFileName}`;
    const displayName = (customName && customName.trim()) || file.name;

    // In-memory demo fallback
    if (!isSupabaseConfigured) {
      const newResume: Resume = {
        id: `res-${Date.now()}`,
        user_id: user.id,
        name: displayName,
        file_path: filePath,
        size_bytes: file.size,
        created_at: new Date().toISOString(),
      };
      setResumes((prev) => [newResume, ...prev]);
      success('Resume uploaded', displayName);
      return newResume;
    }

    // Upload to Supabase Storage private bucket 'resumes'
    const { error: uploadErr } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr);
      const msg = uploadErr.message?.includes('Bucket not found')
        ? 'Storage bucket "resumes" is missing. Please ensure it is created in Supabase.'
        : uploadErr.message;
      toastError('Upload failed', msg);
      throw new Error(msg);
    }

    // Insert row in `resumes` table
    const { data: dbData, error: dbErr } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        name: displayName,
        file_path: filePath,
        size_bytes: file.size,
      })
      .select()
      .single();

    // If DB insert fails, cleanup storage object to avoid orphaned files
    if (dbErr) {
      console.error('Database insert failed, cleaning up storage file:', dbErr);
      await supabase.storage.from('resumes').remove([filePath]);
      toastError('Database error', dbErr.message);
      throw dbErr;
    }

    setResumes((prev) => [dbData, ...prev]);
    success('Resume uploaded', displayName);
    return dbData;
  };

  // 3. Rename Resume
  const renameResume = async (id: string, newName: string): Promise<void> => {
    if (!user) return;
    const trimmed = newName.trim();
    if (!trimmed) {
      toastError('Validation', 'Resume name cannot be empty');
      return;
    }

    const previous = [...resumesRef.current];

    // Optimistic update
    setResumes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, name: trimmed } : r))
    );

    if (!isSupabaseConfigured) {
      success('Renamed', `Updated to ${trimmed}`);
      return;
    }

    try {
      const { error: updateErr } = await supabase
        .from('resumes')
        .update({ name: trimmed })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateErr) throw updateErr;
      success('Resume renamed', trimmed);
    } catch (err: any) {
      console.error('Failed to rename resume:', err);
      setResumes(previous);
      toastError('Rename failed', err.message || 'Could not rename resume');
      throw err;
    }
  };

  // 4. Delete Resume: Remove storage object AND row from `resumes` table
  const deleteResume = async (id: string): Promise<void> => {
    if (!user) return;

    const previous = [...resumesRef.current];
    const target = previous.find((r) => r.id === id);
    if (!target) return;

    // Optimistic delete
    setResumes((prev) => prev.filter((r) => r.id !== id));

    if (!isSupabaseConfigured) {
      success('Resume removed', target.name);
      return;
    }

    try {
      // 1. Delete object from Supabase storage
      const { error: storageErr } = await supabase.storage
        .from('resumes')
        .remove([target.file_path]);

      if (storageErr) {
        console.warn('Storage removal warning (might already be deleted):', storageErr.message);
      }

      // 2. Delete row from resumes table (foreign keys in applications are on delete set null)
      const { error: dbErr } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (dbErr) throw dbErr;

      success('Resume deleted', target.name);
    } catch (err: any) {
      console.error('Failed to delete resume:', err);
      setResumes(previous);
      toastError('Delete failed', err.message || 'Could not delete resume');
      throw err;
    }
  };

  // 5. Get Signed URL (60-second expiry)
  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    if (!isSupabaseConfigured) {
      // Return dummy blob URL or placeholder in demo mode
      return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    }

    try {
      const { data, error: urlErr } = await supabase.storage
        .from('resumes')
        .createSignedUrl(filePath, 60); // 60 seconds expiry

      if (urlErr) throw urlErr;
      return data.signedUrl;
    } catch (err: any) {
      console.error('Failed to generate 60s signed URL:', err);
      toastError('Preview error', err.message || 'Could not generate signed URL');
      return null;
    }
  };

  return {
    resumes,
    isLoading,
    error,
    uploadResume,
    renameResume,
    deleteResume,
    getSignedUrl,
    refetch: fetchResumes,
  };
}
