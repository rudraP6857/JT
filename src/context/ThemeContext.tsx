import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemePreference } from '../types/index.ts';
import { cookieStorage, supabase, isSupabaseConfigured } from '../lib/supabase.ts';

interface ThemeContextType {
  theme: ThemePreference;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_COOKIE_KEY = 'jobtracker_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme from cookie or system preference without using localStorage or sessionStorage
  useEffect(() => {
    const savedTheme = cookieStorage.getItem(THEME_COOKIE_KEY) as ThemePreference | null;
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      setThemeState(savedTheme);
    } else {
      setThemeState('system');
    }
  }, []);

  // Calculate and apply effective theme to <html>
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && mediaQuery.matches);

      const resolved = isDark ? 'dark' : 'light';
      setEffectiveTheme(resolved);

      const root = document.documentElement;
      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    const listener = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  // Sync with Supabase user_settings when user signs in
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const syncUserSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('theme')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!error && data?.theme) {
        const cloudTheme = data.theme as ThemePreference;
        if (cloudTheme === 'light' || cloudTheme === 'dark' || cloudTheme === 'system') {
          setThemeState(cloudTheme);
          cookieStorage.setItem(THEME_COOKIE_KEY, cloudTheme);
        }
      }
    };

    syncUserSettings();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        syncUserSettings();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setTheme = async (newTheme: ThemePreference) => {
    setThemeState(newTheme);
    cookieStorage.setItem(THEME_COOKIE_KEY, newTheme);

    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase
            .from('user_settings')
            .upsert({ user_id: session.user.id, theme: newTheme }, { onConflict: 'user_id' });
        }
      } catch (err) {
        console.error('Failed to sync theme preference to Supabase:', err);
      }
    }
  };

  const toggleTheme = async () => {
    const nextTheme: ThemePreference = effectiveTheme === 'dark' ? 'light' : 'dark';
    await setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
