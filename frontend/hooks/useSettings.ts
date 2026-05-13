import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

export function useSettings() {
  const [language, setLanguageState] = useState<'uz' | 'ru'>('uz');
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [notificationsEnabled, setNotificationsState] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, []);

  const loadFromStorage = () => {
    const storedLang = localStorage.getItem('uff_language') as 'uz' | 'ru' | null;
    const storedTheme = localStorage.getItem('uff_theme') as 'light' | 'dark' | null;
    const storedNotif = localStorage.getItem('uff_notifications');

    if (storedLang) setLanguageState(storedLang);
    if (storedTheme) {
      setThemeState(storedTheme);
      if (storedTheme === 'dark') document.documentElement.classList.add('dark');
    }
    if (storedNotif !== null) setNotificationsState(storedNotif === 'true');
  };

  const setLanguage = async (lang: 'uz' | 'ru') => {
    setLanguageState(lang);
    localStorage.setItem('uff_language', lang);
    document.documentElement.lang = lang;
    try {
      await apiClient.patch('/users/me/', { language: lang });
    } catch (e) {
      console.error('Language save failed:', e);
    }
  };

  const setTheme = (theme: 'light' | 'dark') => {
    setThemeState(theme);
    localStorage.setItem('uff_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    apiClient.patch('/users/me/', { theme }).catch(console.error);
  };

  const setNotifications = async (enabled: boolean) => {
    setNotificationsState(enabled);
    localStorage.setItem('uff_notifications', String(enabled));
    await apiClient.patch('/users/me/', { notifications_enabled: enabled });
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users/me/');
      const lang = res.data.language || 'uz';
      const thm = res.data.theme || 'light';
      const notif = res.data.notifications_enabled ?? true;

      setLanguageState(lang);
      setThemeState(thm);
      setNotificationsState(notif);

      localStorage.setItem('uff_language', lang);
      localStorage.setItem('uff_theme', thm);
      localStorage.setItem('uff_notifications', String(notif));

      document.documentElement.lang = lang;
      if (thm === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error('Settings load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return {
    language,
    theme,
    notificationsEnabled,
    loading,
    setLanguage,
    setTheme,
    setNotifications,
    loadSettings,
  };
}
