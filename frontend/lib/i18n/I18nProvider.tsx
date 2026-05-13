'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { dictionaries, Locale } from './dictionaries';
import { apiClient } from '@/lib/api/client';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void> | void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'uff-locale';

function getNested(obj: any, path: string): any {
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('uz');

  // Initial load: localStorage → backend
  useEffect(() => {
    try {
      const stored = (localStorage.getItem(STORAGE_KEY) as Locale) || null;
      if (stored && (stored === 'uz' || stored === 'ru')) {
        setLocaleState(stored);
        document.documentElement.lang = stored;
      }
    } catch {}

    // Check for auth before fetching from backend
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Try to fetch from backend (overrides if user has it set)
    apiClient
      .get('/users/me/')
      .then((res) => {
        const lang = res.data?.language;
        if (lang === 'uz' || lang === 'ru') {
          setLocaleState(lang);
          document.documentElement.lang = lang;
          try {
            localStorage.setItem(STORAGE_KEY, lang);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    try {
      await apiClient.patch('/users/me/', { language: next });
    } catch (e) {
      // Network/auth fail — local state still updated
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = dictionaries[locale] || dictionaries.uz;
      const value = getNested(dict, key);
      if (typeof value === 'string') return interpolate(value, vars);
      // Fallback to uz if missing
      const fallback = getNested(dictionaries.uz, key);
      if (typeof fallback === 'string') return interpolate(fallback, vars);
      return key;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Graceful fallback when used outside provider (e.g. on server)
    return {
      locale: 'uz',
      setLocale: () => {},
      t: (key: string, vars?: Record<string, string | number>) => {
        const value = getNested(dictionaries.uz, key);
        if (typeof value === 'string') return interpolate(value, vars);
        return key;
      },
    };
  }
  return ctx;
}
