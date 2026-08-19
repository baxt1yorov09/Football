'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { SmartSidebar } from '@/components/layout/SmartSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Calendar, Shield, Camera, Edit, Loader2, Plus, X } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { PhoneChangeModal } from '@/components/profile/PhoneChangeModal';
import { AvatarCropModal } from '@/components/profile/AvatarCropModal';
import { AddLicenseModal } from '@/components/licenses/AddLicenseModal';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useUserStore } from '@/store/userStore';

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  birth_date: string;
  gender: 'male' | 'female';
  region_name: string;
  workplace: string;
  avatar_url: string | null;
  is_active: boolean;
  date_joined: string;
}

interface License {
  id: string;
  license_number: string;
  license_type_code: string;
  issued_at: string;
  expires_at: string;
  color_hex: string;
  image_url?: string;
}

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const updateUser = useUserStore((s) => s.updateUser);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showAddLicense, setShowAddLicense] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const [profileRes, licensesRes] = await Promise.all([
        apiClient.get('/users/me/'),
        apiClient.get('/licenses/'),
      ]);
      setProfile(profileRes.data);
      setFormData(profileRes.data);
      setLicenses(licensesRes.data.results || licensesRes.data);
    } catch (e) {
      console.error('Profil yuklanmadi', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStart = () => {
    setFormData({ ...profile });
    setErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({ ...profile });
    setErrors({});
    setIsEditing(false);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.full_name?.trim()) errs.full_name = t('profile.errors.full_name_required');
    if (!formData.birth_date) errs.birth_date = t('profile.errors.birth_date_required');
    else {
      const age = Math.floor((Date.now() - new Date(formData.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000));
      if (age < 16) errs.birth_date = t('profile.errors.age_too_young');
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = t('profile.errors.email_invalid');
    }
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsSaving(true);
    try {
      const payload = {
        full_name: formData.full_name,
        birth_date: formData.birth_date,
        email: formData.email || '',
        workplace: formData.workplace || '',
      };

      const res = await apiClient.patch('/users/me/', payload);
      setProfile(res.data);
      setFormData(res.data);
      setIsEditing(false);
    } catch (err: any) {
      const serverErrors = err.response?.data || {};
      setErrors(serverErrors);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await apiClient.post('/users/me/avatar/', form, {
        headers: { 'Content-Type': undefined },
      });
      setProfile(prev => prev ? { ...prev, avatar_url: res.data.avatar_url } : prev);
      // Header va boshqa joylardagi user avatar'ini yangilash uchun global store
      updateUser({ avatar_url: res.data.avatar_url });
    } catch {
      console.error('Rasm yuklanmadi');
    } finally {
      setAvatarUploading(false);
      setShowAvatarModal(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!profile?.avatar_url) return;
    if (!window.confirm("Profil rasmini olib tashlashni tasdiqlaysizmi?")) return;
    setAvatarUploading(true);
    try {
      await apiClient.delete('/users/me/avatar/');
      setProfile(prev => prev ? { ...prev, avatar_url: null } : prev);
      updateUser({ avatar_url: null });
    } catch {
      console.error("Rasmni olib tashlashda xatolik");
    } finally {
      setAvatarUploading(false);
    }
  };

  const getLicenseStatus = (expiresAt: string) => {
    const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 3600 * 1000));
    if (daysLeft < 0) return { label: t('profile.status.expired'), color: '#E74C3C', bg: '#FDECEC' };
    if (daysLeft <= 30) return { label: t('profile.status.days_left', { n: daysLeft }), color: '#E67E22', bg: '#FEF5EC' };
    return { label: t('profile.status.active'), color: '#27AE60', bg: '#EAFAF1' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#1A56A0] mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{t('profile.loading')}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      <SmartSidebar />
      
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-[#0D3B6E]">
                {t('profile.title')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('profile.subtitle')}
              </p>
            </div>
            <Button
              onClick={isEditing ? handleSave : handleEditStart}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? <Edit className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              {isSaving ? t('profile.saving') : isEditing ? t('profile.save') : t('profile.edit')}
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="text-center">
                <CardHeader>
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1A56A0] to-[#2D9CDB]">
                          <span className="text-white text-2xl font-bold">
                            {profile.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute bottom-2 right-0 rounded-full w-8 h-8 p-0"
                      onClick={() => setShowAvatarModal(true)}
                      disabled={avatarUploading}
                      title={profile.avatar_url ? "Rasmni almashtirish" : "Rasm qo'shish"}
                    >
                      {avatarUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    </Button>
                    {profile.avatar_url && !avatarUploading && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute bottom-2 left-0 rounded-full w-8 h-8 p-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={handleAvatarRemove}
                        title="Rasmni olib tashlash"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <CardTitle className="text-xl">{profile.full_name}</CardTitle>
                  <Badge className={profile.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {profile.is_active ? t('profile.status.active') : t('profile.status.inactive')}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{profile.email || t('profile.fields.email')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{profile.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{profile.birth_date ? new Date(profile.birth_date).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ') : '—'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Personal Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {t('profile.sections.personal')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('profile.fields.full_name')}
                        </label>
                        <input
                          type="text"
                          value={formData.full_name || ''}
                          disabled={!isEditing}
                          onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 ${errors.full_name ? 'border-red-300' : 'border-gray-300'}`}
                        />
                        {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('profile.fields.email')}
                        </label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          disabled={!isEditing}
                          onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                        />
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('profile.fields.phone')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="tel"
                            value={profile.phone}
                            disabled
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                          />
                          {isEditing && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowPhoneModal(true)}
                              className="text-xs"
                            >
                              {t('profile.fields.phone_change')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('profile.fields.birth_date')}
                        </label>
                        <input
                          type="date"
                          value={formData.birth_date || ''}
                          disabled={!isEditing}
                          onChange={e => setFormData(p => ({ ...p, birth_date: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 ${errors.birth_date ? 'border-red-300' : 'border-gray-300'}`}
                        />
                        {errors.birth_date && <p className="text-xs text-red-500 mt-1">{errors.birth_date}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('profile.fields.workplace')}
                        </label>
                        <input
                          type="text"
                          value={formData.workplace || ''}
                          disabled={!isEditing}
                          onChange={e => setFormData(p => ({ ...p, workplace: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                  {isEditing && (
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                        {t('profile.cancel')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* License Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-3"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    {t('profile.sections.license')}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddLicense(true)}
                    className="flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    {t('profile.license.add_button')}
                  </Button>
                </CardHeader>
                <CardContent>
                  {licenses.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Shield className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">{t('profile.license.no_license')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {licenses.map(lic => {
                        const licStatus = getLicenseStatus(lic.expires_at);
                        return (
                          <div key={lic.id}
                            className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors"
                            style={{ borderLeftWidth: 3, borderLeftColor: lic.color_hex }}
                          >
                            <div className="flex flex-col md:flex-row gap-4">
                              {lic.image_url && (
                                <a
                                  href={lic.image_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex-shrink-0 group"
                                  title={t('profile.license.image_view')}
                                >
                                  {/\.(pdf)(\?|$)/i.test(lic.image_url) ? (
                                    <div className="w-24 h-24 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 text-xs font-semibold group-hover:border-[#1A56A0]">
                                      PDF
                                    </div>
                                  ) : (
                                    <img
                                      src={lic.image_url}
                                      alt={lic.license_number}
                                      className="w-24 h-24 object-cover rounded-lg border border-gray-200 group-hover:border-[#1A56A0]"
                                    />
                                  )}
                                </a>
                              )}
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-600">{t('profile.license.number')}</p>
                                  <p className="font-semibold text-lg break-all">{lic.license_number}</p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-600">{t('profile.license.type')}</p>
                                  <span className="inline-block text-xs font-bold px-2 py-1 rounded-lg text-white" style={{ backgroundColor: lic.color_hex }}>
                                    {lic.license_type_code}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-600">{t('profile.license.issued')}</p>
                                  <p className="font-semibold text-lg">{new Date(lic.issued_at).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ')}</p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-600">{t('profile.license.expires')}</p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-lg">{new Date(lic.expires_at).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ')}</p>
                                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: licStatus.color, backgroundColor: licStatus.bg }}>
                                      {licStatus.label}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <PhoneChangeModal
        isOpen={showPhoneModal}
        currentPhone={profile.phone}
        currentEmail={profile.email}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={(newPhone) => {
          setProfile(p => p ? { ...p, phone: newPhone } : p);
          setShowPhoneModal(false);
        }}
      />

      <AvatarCropModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSave={handleAvatarChange}
      />

      <AddLicenseModal
        open={showAddLicense}
        onClose={() => setShowAddLicense(false)}
        onCreated={() => {
          setShowAddLicense(false);
          setToast({ type: 'success', msg: t('profile.license.add_success') });
          setTimeout(() => setToast(null), 3000);
          loadProfile();
        }}
      />

      {toast && (
        <div
          className={`fixed top-20 right-6 z-[100] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
