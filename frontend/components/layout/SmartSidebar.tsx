'use client';

/**
 * SmartSidebar — foydalanuvchi rolini aniqlab mos sidebar'ni render qiladi.
 *
 * Admin (super_admin / region_admin yoki localStorage.adminAccessToken):
 *   → AdminSidebar (bosilganda /admin?tab=X ga o'tadi)
 * Aks holda:
 *   → User Sidebar (oddiy nav)
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAuth } from '@/hooks/useAuth';

interface SmartSidebarProps {
  /** Hozir admin paneldagi qaysi tab faolligi (visual highlight uchun) */
  adminActiveTab?: string;
}

export function SmartSidebar({ adminActiveTab = '' }: SmartSidebarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const hasAdminToken =
      typeof window !== 'undefined' && !!localStorage.getItem('adminAccessToken');
    const roleAdmin = !!user?.role && /admin/i.test(user.role);
    setIsAdmin(hasAdminToken || roleAdmin);
  }, [user]);

  if (isAdmin) {
    return (
      <AdminSidebar
        activeTab={adminActiveTab}
        setActiveTab={(tab) => router.push(`/admin?tab=${tab}`)}
      />
    );
  }

  return <Sidebar />;
}

export default SmartSidebar;
