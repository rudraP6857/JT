import { createClient } from '@supabase/supabase-js';

// Custom Auth Storage Adapter using Cookies (SameSite=Lax, 30-day expiry)
// Strictly avoids localStorage and sessionStorage as per system specification.
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof document === 'undefined') return null;
    const target = encodeURIComponent(key) + '=';
    const cookieParts = document.cookie.split(';');
    for (let part of cookieParts) {
      part = part.trim();
      if (part.startsWith(target)) {
        try {
          return decodeURIComponent(part.substring(target.length));
        } catch {
          return part.substring(target.length);
        }
      }
    }
    return null;
  },

  setItem: (key: string, value: string): void => {
    if (typeof document === 'undefined') return;
    const encodedKey = encodeURIComponent(key);
    const encodedVal = encodeURIComponent(value);
    document.cookie = `${encodedKey}=${encodedVal}; max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
  },

  removeItem: (key: string): void => {
    if (typeof document === 'undefined') return;
    const encodedKey = encodeURIComponent(key);
    document.cookie = `${encodedKey}=; max-age=0; path=/; SameSite=Lax`;
  },
};

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Auto-format Project URL if the user provides just the project ID or forgets https://
export const formatSupabaseUrl = (input: string): string => {
  if (!input) return '';
  const trimmed = input.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.includes('.supabase.co')) {
    return `https://${trimmed}`;
  }
  return `https://${trimmed}.supabase.co`;
};

const supabaseUrl = formatSupabaseUrl(rawUrl);
const supabaseAnonKey = rawKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey !== 'your-anon-key' &&
  !supabaseAnonKey.includes('placeholder')
);

// Fallback dummy URL and key to prevent instantiation failure before env vars are populated
const validUrl = isSupabaseConfigured ? supabaseUrl : 'https://jobtracker.supabase.co';
const validKey = isSupabaseConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const supabase = createClient(validUrl, validKey, {
  auth: {
    storage: cookieStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
