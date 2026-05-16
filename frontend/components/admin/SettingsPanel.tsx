'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Lock, Bell, Database, Award,
  Save, RefreshCw, CheckCircle, AlertCircle, Eye, EyeOff,
  Shield, Globe, Clock, Mail, Phone,
  Smartphone, Download, Trash2, HardDrive, X, Copy, List,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useTheme, type Theme } from '@/lib/theme/ThemeProvider';
import { BackupListModal } from './BackupListModal';
import { adminApi } from '@/lib/adminApi';

// ============ Types ============
interface SystemSettings {
  system_name: string;
  admin_email: string;
  admin_phone: string;
  timezone: string;
  description: string;
  require_2fa: boolean;
  strong_password_required: boolean;
  max_login_attempts: number;
  session_timeout_minutes: number;
  backup_schedule: string;
  log_retention: string;
  maintenance_mode: boolean;
  updated_at?: string;
  updated_by_name?: string;
}

interface NotificationPref {
  id: number;
  notification_type: string;
  notification_type_display: string;
  email_enabled: boolean;
  telegram_enabled: boolean;
  in_app_enabled: boolean;
}

interface UserProfile {
  language?: string;
  theme?: string;
  two_factor_enabled?: boolean;
}

interface SystemStatus {
  backup_count: number;
  last_backup: string | null;
  log_count: number;
  log_size_mb: number;
  server_time: string;
}

// ============ Helpers ============
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken');
}

async function api<T = any>(
  url: string,
  method: string = 'GET',
  body?: any
): Promise<T> {
  // adminApi 401/403 paytida tokenni avtomatik yangilab qayta urinadi
  return adminApi<T>(url, { method, body });
}

// ============ Toast ============
type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType; }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);
  const ToastContainer = (
    <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-white font-medium flex items-center gap-2 min-w-[280px] ${
              t.type === 'success' ? 'bg-green-600'
                : t.type === 'error' ? 'bg-red-600'
                : 'bg-blue-600'
            }`}
          >
            {t.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {t.type === 'info' && <AlertCircle className="w-5 h-5" />}
            <span>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
  return { show, ToastContainer };
}

// ============ Toggle Switch ============
function Toggle({ enabled, onChange, disabled }: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`w-14 h-7 rounded-full transition-all relative shrink-0 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${enabled ? 'bg-[#1A56A0]' : 'bg-gray-300'}`}
    >
      <div
        className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${
          enabled ? 'right-0.5' : 'left-0.5'
        }`}
      />
    </button>
  );
}

// ============ MAIN COMPONENT ============
export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const { show: showToast, ToastContainer } = useToast();

  // System settings state
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState<NotificationPref[]>([]);
  // User profile (language, theme, 2fa)
  const [userProfile, setUserProfile] = useState<UserProfile>({ language: 'uz', theme: 'light', two_factor_enabled: false });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // 2FA state
  const [show2faModal, setShow2faModal] = useState(false);
  const [twoFaSetup, setTwoFaSetup] = useState<{ qr_code: string; secret: string } | null>(null);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaMode, setTwoFaMode] = useState<'enable' | 'disable'>('enable');

  // System status & backup/logs
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [backupRunning, setBackupRunning] = useState(false);
  const [logsRunning, setLogsRunning] = useState(false);
  const [showBackupList, setShowBackupList] = useState(false);

  // i18n & theme hooks
  const { locale, setLocale, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const tp = useCallback((key: string, vars?: Record<string, string | number>) => t(`admin.settings_panel.${key}`, vars), [t]);

  const tabs = [
    { id: 'general', label: t('admin.tabs.general'), icon: Settings },
    { id: 'security', label: t('admin.tabs.security'), icon: Lock },
    { id: 'notifications', label: t('admin.tabs.notifications'), icon: Bell },
    { id: 'system', label: t('admin.tabs.system'), icon: Database },
    { id: 'appearance', label: t('admin.tabs.appearance'), icon: Award },
  ];

  // Load all data on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [sys, prefs, profile, statusData] = await Promise.all([
          api<SystemSettings>('/api/settings/system'),
          api<NotificationPref[]>('/api/settings/notifications'),
          api<UserProfile>('/api/users/me').catch(() => ({} as UserProfile)),
          api<SystemStatus>('/api/settings/status').catch(() => null),
        ]);
        if (!mounted) return;
        setSettings(sys);
        setNotifPrefs(prefs);
        setUserProfile({
          language: profile?.language || 'uz',
          theme: profile?.theme || 'light',
          two_factor_enabled: !!profile?.two_factor_enabled,
        });
        setSystemStatus(statusData);
      } catch (err: any) {
        showToast(tp('toasts.load_error', { msg: err.message }), 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [showToast]);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await api<SystemStatus>('/api/settings/status');
      setSystemStatus(s);
    } catch {}
  }, []);

  // 2FA — start setup (request QR code)
  const start2FASetup = async () => {
    try {
      setTwoFaLoading(true);
      const data = await api<{ qr_code: string; secret: string }>('/api/users/2fa/setup');
      setTwoFaSetup(data);
      setTwoFaMode('enable');
      setTwoFaCode('');
      setShow2faModal(true);
    } catch (err: any) {
      showToast(tp('toasts.twofa_setup_error', { msg: err.message }), 'error');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const verify2FACode = async () => {
    if (!twoFaCode || twoFaCode.length !== 6) {
      showToast(tp('toasts.code_required'), 'error');
      return;
    }
    try {
      setTwoFaLoading(true);
      const endpoint = twoFaMode === 'enable' ? '/api/users/2fa/verify' : '/api/users/2fa/disable';
      await api(endpoint, 'POST', { code: twoFaCode });
      setUserProfile({ ...userProfile, two_factor_enabled: twoFaMode === 'enable' });
      setShow2faModal(false);
      setTwoFaCode('');
      setTwoFaSetup(null);
      showToast(
        twoFaMode === 'enable' ? tp('toasts.twofa_enabled') : tp('toasts.twofa_disabled'),
        'success'
      );
    } catch (err: any) {
      showToast(tp('toasts.confirm_error', { msg: err.message }), 'error');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const start2FADisable = () => {
    setTwoFaMode('disable');
    setTwoFaSetup(null);
    setTwoFaCode('');
    setShow2faModal(true);
  };

  // Backup
  const runBackupNow = async () => {
    try {
      setBackupRunning(true);
      const result = await api<any>('/api/settings/backup-now', 'POST');
      showToast(tp('toasts.backup_done', { size: result.size_mb }), 'success');
      await refreshStatus();
    } catch (err: any) {
      showToast(tp('toasts.backup_error', { msg: err.message }), 'error');
    } finally {
      setBackupRunning(false);
    }
  };

  // Clean logs
  const cleanLogs = async () => {
    if (!confirm(tp('system.clean_logs_confirm'))) return;
    try {
      setLogsRunning(true);
      const result = await api<any>('/api/settings/clean-logs', 'POST');
      showToast(result.detail, 'success');
      await refreshStatus();
    } catch (err: any) {
      showToast(tp('toasts.clean_error', { msg: err.message }), 'error');
    } finally {
      setLogsRunning(false);
    }
  };

  const copySecret = () => {
    if (twoFaSetup?.secret) {
      navigator.clipboard.writeText(twoFaSetup.secret);
      showToast(tp('toasts.copy_secret'), 'success');
    }
  };

  // Save system settings (general/security/system tabs)
  const saveSystemSettings = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const updated = await api<SystemSettings>('/api/settings/system', 'PATCH', settings);
      setSettings(updated);
      setSaveStatus('saved');
      showToast(tp('toasts.settings_saved'), 'success');
      // Banner darhol yangilanishi uchun
      try {
        window.dispatchEvent(new CustomEvent('maintenance:changed'));
        sessionStorage.removeItem('maintenance:dismissedAt');
      } catch {}
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      showToast(tp('toasts.save_error', { msg: err.message }), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save notification preferences
  const saveNotifPrefs = async (next: NotificationPref[]) => {
    setNotifPrefs(next);
    try {
      const items = next.map(p => ({
        notification_type: p.notification_type,
        email_enabled: p.email_enabled,
        telegram_enabled: p.telegram_enabled,
        in_app_enabled: p.in_app_enabled,
      }));
      await api('/api/settings/notifications', 'PATCH', items);
      showToast(tp('toasts.notif_saved'), 'success');
    } catch (err: any) {
      showToast(tp('toasts.save_error', { msg: err.message }), 'error');
    }
  };


  // Change password
  const changePassword = async () => {
    if (!passwordForm.current || !passwordForm.new) {
      showToast(tp('toasts.password_required'), 'error');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      showToast(tp('toasts.password_mismatch'), 'error');
      return;
    }
    if (passwordForm.new.length < 8) {
      showToast(tp('toasts.password_short'), 'error');
      return;
    }
    if (!/[A-Z]/.test(passwordForm.new)) {
      showToast('Kamida 1 ta katta harf kerak', 'error');
      return;
    }
    if (!/[0-9]/.test(passwordForm.new)) {
      showToast('Kamida 1 ta raqam kerak', 'error');
      return;
    }
    try {
      setPwSaving(true);
      await api('/api/users/change-password', 'POST', {
        current_password: passwordForm.current,
        new_password: passwordForm.new,
      });
      setPasswordForm({ current: '', new: '', confirm: '' });
      showToast(tp('toasts.password_changed'), 'success');
    } catch (err: any) {
      showToast(tp('toasts.password_error', { msg: err.message }), 'error');
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#1A56A0]" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-gray-700">{tp('load_error')}</p>
      </div>
    );
  }

  return (
    <>
      {ToastContainer}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tp('title')}</h1>
            <p className="text-gray-500 mt-1">
              {tp('subtitle')}
              {settings.updated_at && (
                <span className="ml-2 text-xs text-gray-400">
                  • {tp('last_update')}: {new Date(settings.updated_at).toLocaleString(locale === 'ru' ? 'ru-RU' : 'uz-UZ')}
                  {settings.updated_by_name && ` • ${settings.updated_by_name}`}
                </span>
              )}
            </p>
          </div>
          {(activeTab === 'general' || activeTab === 'security' || activeTab === 'system') && (
            <button
              onClick={saveSystemSettings}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
                saveStatus === 'saved'
                  ? 'bg-green-500 text-white shadow-green-500/25'
                  : 'bg-[#1A56A0] text-white shadow-blue-500/25 hover:bg-[#0D3B6E]'
              }`}
            >
              {saving ? <RefreshCw className="w-5 h-5 animate-spin" />
                : saveStatus === 'saved' ? <CheckCircle className="w-5 h-5" />
                : <Save className="w-5 h-5" />}
              {saving ? tp('saving') : saveStatus === 'saved' ? tp('saved') : tp('save')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 sticky top-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#1A56A0] text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
              >
                {/* GENERAL */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#1A56A0] to-[#0D3B6E] rounded-xl flex items-center justify-center text-white">
                        <Award className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{tp('general.section_title')}</h3>
                        <p className="text-sm text-gray-500">{tp('general.section_subtitle')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Award className="w-4 h-4" /> {tp('general.system_name')}
                        </label>
                        <input
                          type="text"
                          value={settings.system_name}
                          onChange={(e) => setSettings({ ...settings, system_name: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Mail className="w-4 h-4" /> {tp('general.admin_email')}
                        </label>
                        <input
                          type="email"
                          value={settings.admin_email}
                          onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Phone className="w-4 h-4" /> {tp('general.phone')}
                        </label>
                        <input
                          type="tel"
                          value={settings.admin_phone}
                          onChange={(e) => setSettings({ ...settings, admin_phone: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Clock className="w-4 h-4" /> {tp('general.timezone')}
                        </label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
                        >
                          <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                          <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                          <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
                          <option value="UTC">UTC (UTC+0)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{tp('general.description')}</label>
                      <textarea
                        rows={3}
                        value={settings.description}
                        onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* SECURITY */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 pb-4 border-b border-gray-100 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#1A56A0]" /> {tp('security.title')}
                    </h3>

                    <div className="space-y-4">
                      {/* 2FA - real flow */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${userProfile.two_factor_enabled ? 'bg-green-100' : 'bg-gray-200'}`}>
                            <Smartphone className={`w-5 h-5 ${userProfile.two_factor_enabled ? 'text-green-600' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {tp('security.twofa_label')}
                              {userProfile.two_factor_enabled && (
                                <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{tp('security.twofa_enabled_badge')}</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {tp('security.twofa_desc')}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={twoFaLoading}
                          onClick={userProfile.two_factor_enabled ? start2FADisable : start2FASetup}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 ${
                            userProfile.two_factor_enabled
                              ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                              : 'bg-[#1A56A0] text-white hover:bg-[#0D3B6E]'
                          }`}
                        >
                          {twoFaLoading ? <RefreshCw className="w-4 h-4 animate-spin" />
                            : userProfile.two_factor_enabled ? tp('security.disable') : tp('security.enable')}
                        </button>
                      </div>

                      {/* Strong password (system-wide) */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">{tp('security.strong_password')}</p>
                          <p className="text-sm text-gray-500">{tp('security.strong_password_desc')}</p>
                        </div>
                        <Toggle
                          enabled={settings.strong_password_required}
                          onChange={(v) => setSettings({ ...settings, strong_password_required: v })}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">{tp('security.max_login')}</label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={settings.max_login_attempts}
                            onChange={(e) => setSettings({ ...settings, max_login_attempts: parseInt(e.target.value) || 5 })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                          />
                          <p className="text-xs text-gray-500">{tp('security.max_login_desc')}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">{tp('security.session_timeout')}</label>
                          <input
                            type="number"
                            min={5}
                            max={1440}
                            value={settings.session_timeout_minutes}
                            onChange={(e) => setSettings({ ...settings, session_timeout_minutes: parseInt(e.target.value) || 30 })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                          />
                          <p className="text-xs text-gray-500">{tp('security.session_timeout_desc')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> {tp('security.change_password')}
                      </h4>
                      <div className="space-y-4 max-w-md">
                        <div className="relative">
                          <input
                            type={showCurrent ? 'text' : 'password'}
                            placeholder={tp('security.current_password')}
                            value={passwordForm.current}
                            onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                            className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrent(!showCurrent)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showNew ? 'text' : 'password'}
                            placeholder={tp('security.new_password')}
                            value={passwordForm.new}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                            className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <input
                          type={showNew ? 'text' : 'password'}
                          placeholder={tp('security.confirm_password')}
                          value={passwordForm.confirm}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                        />
                        {passwordForm.new && (
                          <div className="space-y-1 -mt-1">
                            {[
                              { ok: passwordForm.new.length >= 8, text: 'Kamida 8 ta belgi' },
                              { ok: /[A-Z]/.test(passwordForm.new), text: 'Kamida 1 ta katta harf' },
                              { ok: /[0-9]/.test(passwordForm.new), text: 'Kamida 1 ta raqam' },
                              { ok: !!passwordForm.confirm && passwordForm.new === passwordForm.confirm, text: 'Parollar mos' },
                            ].map(({ ok, text }) => (
                              <p key={text} className={`text-xs flex items-center gap-1.5 ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                                <span>{ok ? '✓' : '○'}</span> {text}
                              </p>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={changePassword}
                          disabled={pwSaving}
                          className="px-6 py-2.5 bg-[#1A56A0] text-white rounded-lg hover:bg-[#0D3B6E] transition-all disabled:opacity-60 flex items-center gap-2"
                        >
                          {pwSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                          {tp('security.update_password')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTIFICATIONS */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 pb-4 border-b border-gray-100 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-[#1A56A0]" /> {tp('notifications.title')}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {tp('notifications.subtitle')}
                    </p>

                    <div className="space-y-3">
                      {notifPrefs.map((pref) => (
                        <div key={pref.id} className="p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-medium text-gray-900">{pref.notification_type_display}</p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {[
                              { key: 'in_app_enabled' as const, label: tp('notifications.channel_in_app') },
                              { key: 'email_enabled' as const, label: tp('notifications.channel_email') },
                              { key: 'telegram_enabled' as const, label: tp('notifications.channel_telegram') },
                            ].map(channel => (
                              <label key={channel.key} className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-[#1A56A0]">
                                <input
                                  type="checkbox"
                                  checked={pref[channel.key]}
                                  onChange={(e) => {
                                    const next = notifPrefs.map(p =>
                                      p.id === pref.id ? { ...p, [channel.key]: e.target.checked } : p
                                    );
                                    saveNotifPrefs(next);
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-[#1A56A0] focus:ring-[#1A56A0]"
                                />
                                <span className="text-sm text-gray-700">{channel.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SYSTEM */}
                {activeTab === 'system' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 pb-4 border-b border-gray-100 flex items-center gap-2">
                      <Database className="w-5 h-5 text-[#1A56A0]" /> {tp('system.title')}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{tp('system.backup_schedule')}</label>
                        <select
                          value={settings.backup_schedule}
                          onChange={(e) => setSettings({ ...settings, backup_schedule: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                        >
                          <option value="daily">{tp('system.backup_daily')}</option>
                          <option value="weekly">{tp('system.backup_weekly')}</option>
                          <option value="monthly">{tp('system.backup_monthly')}</option>
                          <option value="disabled">{tp('system.backup_disabled')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{tp('system.log_retention')}</label>
                        <select
                          value={settings.log_retention}
                          onChange={(e) => setSettings({ ...settings, log_retention: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                        >
                          <option value="30">{tp('system.retention_30')}</option>
                          <option value="90">{tp('system.retention_90')}</option>
                          <option value="365">{tp('system.retention_365')}</option>
                          <option value="forever">{tp('system.retention_forever')}</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl">
                      <div>
                        <p className="font-medium text-orange-900">{tp('system.maintenance_title')}</p>
                        <p className="text-sm text-orange-800 mt-1">
                          {tp('system.maintenance_desc')}
                        </p>
                      </div>
                      <Toggle
                        enabled={settings.maintenance_mode}
                        onChange={(v) => setSettings({ ...settings, maintenance_mode: v })}
                      />
                    </div>

                    {/* System status */}
                    {systemStatus && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <HardDrive className="w-5 h-5 text-blue-600" />
                              <p className="font-medium text-blue-900">{tp('system.backup_status')}</p>
                            </div>
                            {systemStatus.backup_count > 0 && (
                              <button
                                onClick={() => setShowBackupList(true)}
                                className="text-xs font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                <List className="w-3.5 h-3.5" />
                                {tp('system.backup_view')}
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-blue-800">
                            {tp('system.backup_total', { n: systemStatus.backup_count })}
                          </p>
                          {systemStatus.last_backup && (
                            <p className="text-xs text-blue-700 mt-1">
                              {tp('system.backup_last', { date: new Date(systemStatus.last_backup).toLocaleString(locale === 'ru' ? 'ru-RU' : 'uz-UZ') })}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <button
                              onClick={runBackupNow}
                              disabled={backupRunning}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                              {backupRunning
                                ? <RefreshCw className="w-4 h-4 animate-spin" />
                                : <Download className="w-4 h-4" />}
                              {tp('system.backup_run_now')}
                            </button>
                            {systemStatus.backup_count > 0 && (
                              <button
                                onClick={() => setShowBackupList(true)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 text-sm rounded-lg hover:bg-blue-100"
                              >
                                <List className="w-4 h-4" />
                                {tp('system.backup_open_list')}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                          <div className="flex items-center gap-3 mb-2">
                            <Database className="w-5 h-5 text-purple-600" />
                            <p className="font-medium text-purple-900">{tp('system.logs')}</p>
                          </div>
                          <p className="text-sm text-purple-800">
                            {tp('system.logs_total', { n: systemStatus.log_count, size: systemStatus.log_size_mb })}
                          </p>
                          <button
                            onClick={cleanLogs}
                            disabled={logsRunning}
                            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"
                          >
                            {logsRunning
                              ? <RefreshCw className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                            {tp('system.clean_logs')}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-900">{tp('system.warning_title')}</p>
                          <p className="text-sm text-yellow-800 mt-1">
                            {tp('system.warning_text')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* APPEARANCE */}
                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 pb-4 border-b border-gray-100 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-[#1A56A0]" /> {tp('appearance.title')}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {tp('appearance.subtitle')}
                    </p>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{tp('appearance.language')}</label>
                      <div className="flex gap-3 flex-wrap">
                        {[
                          { code: 'uz' as const, label: "O'zbek", flag: '🇺🇿' },
                          { code: 'ru' as const, label: 'Русский', flag: '🇷🇺' },
                        ].map((lang) => (
                          <button
                            key={lang.code}
                            onClick={async () => {
                              await setLocale(lang.code);
                              showToast(tp('toasts.language_changed', { lang: lang.label }), 'success');
                            }}
                            className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                              locale === lang.code
                                ? 'border-[#1A56A0] bg-blue-50 text-[#1A56A0] font-medium'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span>{lang.flag}</span>
                            {lang.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{tp('appearance.language_hint')}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{tp('appearance.theme')}</label>
                      <div className="flex gap-3 flex-wrap">
                        {[
                          { code: 'light' as Theme, label: tp('appearance.light'), icon: '☀️' },
                          { code: 'dark' as Theme, label: tp('appearance.dark'), icon: '🌙' },
                          { code: 'auto' as Theme, label: tp('appearance.auto'), icon: '🖥️' },
                        ].map((th) => (
                          <button
                            key={th.code}
                            onClick={() => {
                              setTheme(th.code);
                              showToast(tp('toasts.theme_changed', { theme: th.label }), 'success');
                            }}
                            className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                              theme === th.code
                                ? 'border-[#1A56A0] bg-blue-50 text-[#1A56A0] font-medium'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span>{th.icon}</span>
                            {th.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        {tp('appearance.theme_hint')}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 2FA Modal */}
      <AnimatePresence>
        {show2faModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4"
            onClick={() => !twoFaLoading && setShow2faModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Smartphone className="w-6 h-6 text-[#1A56A0]" />
                  {twoFaMode === 'enable' ? tp('twofa_modal.setup_title') : tp('twofa_modal.disable_title')}
                </h3>
                <button
                  onClick={() => setShow2faModal(false)}
                  disabled={twoFaLoading}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {twoFaMode === 'enable' && twoFaSetup ? (
                <div className="space-y-4">
                  <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                    <li>{tp('twofa_modal.step1')}</li>
                    <li>{tp('twofa_modal.step2')}</li>
                    <li>{tp('twofa_modal.step3')}</li>
                  </ol>

                  <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <img
                      src={twoFaSetup.qr_code}
                      alt="2FA QR code"
                      className="w-48 h-48 bg-white p-2 rounded-lg shadow"
                    />
                    <div className="w-full">
                      <p className="text-xs text-gray-500 text-center mb-1">{tp('twofa_modal.secret_label')}</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono text-center break-all">
                          {twoFaSetup.secret}
                        </code>
                        <button
                          onClick={copySecret}
                          className="p-2 text-gray-500 hover:text-[#1A56A0] hover:bg-blue-50 rounded-lg transition-all"
                          title={tp('twofa_modal.copy')}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      {tp('twofa_modal.code_label')}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={twoFaCode}
                      onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                      autoFocus
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      {tp('twofa_modal.disable_warning')}
                    </p>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={twoFaCode}
                    onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    autoFocus
                  />
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShow2faModal(false)}
                  disabled={twoFaLoading}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {tp('twofa_modal.cancel')}
                </button>
                <button
                  onClick={verify2FACode}
                  disabled={twoFaLoading || twoFaCode.length !== 6}
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
                    twoFaMode === 'enable' ? 'bg-[#1A56A0] hover:bg-[#0D3B6E]' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {twoFaLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {twoFaMode === 'enable' ? tp('security.enable') : tp('security.disable')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BackupListModal
        open={showBackupList}
        onClose={() => setShowBackupList(false)}
        onChange={refreshStatus}
      />
    </>
  );
}
