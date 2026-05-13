'use client';

import { useCallback, useEffect, useState } from 'react';

export interface DashboardStats {
  active_licenses: number;
  expired_licenses: number;
  suspended_licenses: number;
  expiring_soon: number;
  pending_applications: number;
  approved_applications: number;
  rejected_applications: number;
  total_applications: number;
}

export interface DashboardLicense {
  id: string;
  license_number: string;
  license_type_code: string;
  license_type_name: string;
  color_hex: string;
  issued_at: string;
  expires_at: string;
  days_left: number;
  is_expiring_soon: boolean;
  pdf_url: string;
}

export interface DashboardApplication {
  id: string;
  license_type_code: string;
  license_type_name: string;
  status: string;
  status_display: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string;
  admin_note: string;
}

export interface DashboardData {
  stats: DashboardStats;
  active_licenses: DashboardLicense[];
  recent_applications: DashboardApplication[];
  profile: {
    full_name: string;
    phone: string;
    region: string;
    role: string;
    is_onboarded: boolean;
  };
  server_time: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken') || localStorage.getItem('adminAccessToken');
}

// Singleton-like cache to avoid 3 simultaneous fetches from
// StatsOverview/ActiveLicenses/RecentApplications.
let _cache: { data: DashboardData; ts: number } | null = null;
let _pending: Promise<DashboardData> | null = null;
const TTL_MS = 30_000;

async function fetchDashboard(force = false): Promise<DashboardData> {
  if (!force && _cache && Date.now() - _cache.ts < TTL_MS) return _cache.data;
  if (_pending) return _pending;

  const token = getToken();
  _pending = fetch('/api/users/me/dashboard/', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then(async (r) => {
    _pending = null;
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || err.error || `HTTP ${r.status}`);
    }
    const data: DashboardData = await r.json();
    _cache = { data, ts: Date.now() };
    return data;
  }).catch((e) => {
    _pending = null;
    throw e;
  });
  return _pending;
}

export function invalidateDashboard() {
  _cache = null;
}

export function useUserDashboard(refreshInterval = 60_000) {
  const [data, setData] = useState<DashboardData | null>(_cache?.data || null);
  const [loading, setLoading] = useState(!_cache);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    try {
      if (!_cache) setLoading(true);
      setError(null);
      const d = await fetchDashboard(force);
      setData(d);
    } catch (e: any) {
      setError(e.message || 'Yuklab bo\'lmadi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
    if (refreshInterval > 0) {
      const t = setInterval(() => load(true), refreshInterval);
      return () => clearInterval(t);
    }
  }, [load, refreshInterval]);

  return { data, loading, error, refresh: () => load(true) };
}
