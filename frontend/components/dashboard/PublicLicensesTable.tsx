'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Search, QrCode, AlertCircle, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n/I18nProvider';

interface PublicLicense {
  id: string;
  license_number: string;
  license_type_code: string;
  license_type_name: string;
  license_type_name_ru: string;
  color_hex: string;
  full_name: string;
  region: string;
  status: string;
  issued_at: string;
  expires_at: string;
  verification_url: string;
  phone?: string;
  email?: string;
}

interface LicenseType {
  code: string;
  name_uz: string;
  name_ru?: string;
  color_hex?: string;
}

interface APIResponse {
  count: number;
  limit: number;
  offset: number;
  results: PublicLicense[];
}

const PAGE_SIZE = 10;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken') || localStorage.getItem('adminAccessToken');
}

function formatDate(iso: string, locale: string = 'uz'): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch { return iso; }
}

export function PublicLicensesTable() {
  const { t, locale } = useI18n();

  const [data, setData] = useState<APIResponse | null>(null);
  const [types, setTypes] = useState<LicenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter]);

  // Load license types for filter
  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const r = await fetch('/api/licenses/types/', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!r.ok) return;
        const j = await r.json();
        setTypes(Array.isArray(j?.results) ? j.results : []);
      } catch {
        setTypes([]);
      }
    })();
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String((page - 1) * PAGE_SIZE));
      if (typeFilter) params.set('license_type', typeFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const r = await fetch(`/api/licenses/public/?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || err.error || `HTTP ${r.status}`);
      }
      const j: APIResponse = await r.json();
      setData(j);
    } catch (e: any) {
      setError(e.message || 'Yuklab bo\'lmadi');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.count / PAGE_SIZE));
  }, [data]);

  const rows = data?.results || [];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-lg font-bold text-[#0D3B6E] flex items-center gap-2">
            <Award className="w-5 h-5" />
            {locale === 'ru' ? 'Все активные лицензии' : 'Barcha faol litsenziyalar'}
          </CardTitle>
          {data && (
            <Badge variant="secondary" className="text-xs">
              {locale === 'ru' ? `Всего: ${data.count}` : `Jami: ${data.count}`}
            </Badge>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === 'ru'
                ? 'Поиск по имени, номеру лицензии...'
                : 'Ism, litsenziya raqami bo\'yicha qidirish...'}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]/30 focus:border-[#1A56A0]"
            />
          </div>

          {/* Type filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Filter className="w-3.5 h-3.5" />
              <span>{locale === 'ru' ? 'Тип:' : 'Toifa:'}</span>
            </div>
            <button
              onClick={() => setTypeFilter('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                !typeFilter
                  ? 'bg-[#1A56A0] text-white border-[#1A56A0]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#1A56A0]'
              }`}
            >
              {locale === 'ru' ? 'Все' : 'Barchasi'}
            </button>
            {types.map((tp) => (
              <button
                key={tp.code}
                onClick={() => setTypeFilter(tp.code)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                  typeFilter === tp.code
                    ? 'text-white border-transparent'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#1A56A0]'
                }`}
                style={typeFilter === tp.code ? { backgroundColor: tp.color_hex || '#1A56A0' } : undefined}
              >
                {tp.code}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                  <th className="py-2 pr-3 font-medium">#</th>
                  <th className="py-2 pr-3 font-medium">
                    {locale === 'ru' ? 'Тренер' : 'Murabbiy'}
                  </th>
                  <th className="py-2 pr-3 font-medium">
                    {locale === 'ru' ? 'Тип' : 'Toifa'}
                  </th>
                  <th className="py-2 pr-3 font-medium hidden md:table-cell">
                    {locale === 'ru' ? 'Номер' : 'Raqam'}
                  </th>
                  <th className="py-2 pr-3 font-medium hidden lg:table-cell">
                    {locale === 'ru' ? 'Регион' : 'Hudud'}
                  </th>
                  <th className="py-2 pr-3 font-medium hidden md:table-cell">
                    {locale === 'ru' ? 'Выдан' : 'Berilgan'}
                  </th>
                  <th className="py-2 pr-3 font-medium hidden md:table-cell">
                    {locale === 'ru' ? 'Истекает' : 'Tugaydi'}
                  </th>
                  <th className="py-2 pr-3 font-medium text-right">QR</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100 animate-pulse">
                      <td className="py-3 pr-3"><div className="h-3 w-6 bg-gray-200 rounded" /></td>
                      <td className="py-3 pr-3"><div className="h-3 w-32 bg-gray-200 rounded" /></td>
                      <td className="py-3 pr-3"><div className="h-5 w-10 bg-gray-200 rounded-full" /></td>
                      <td className="py-3 pr-3 hidden md:table-cell"><div className="h-3 w-28 bg-gray-100 rounded" /></td>
                      <td className="py-3 pr-3 hidden lg:table-cell"><div className="h-3 w-20 bg-gray-100 rounded" /></td>
                      <td className="py-3 pr-3 hidden md:table-cell"><div className="h-3 w-20 bg-gray-100 rounded" /></td>
                      <td className="py-3 pr-3 hidden md:table-cell"><div className="h-3 w-20 bg-gray-100 rounded" /></td>
                      <td className="py-3 pr-3 text-right"><div className="h-4 w-4 bg-gray-200 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-gray-500">
                      {locale === 'ru' ? 'Ничего не найдено' : 'Hech narsa topilmadi'}
                    </td>
                  </tr>
                ) : (
                  rows.map((lic, idx) => {
                    const localizedTypeName = locale === 'ru'
                      ? (lic.license_type_name_ru || lic.license_type_name)
                      : lic.license_type_name;
                    return (
                      <tr key={lic.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-3 text-gray-500">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="py-3 pr-3">
                          <p className="font-medium text-[#0D3B6E] truncate max-w-[200px]">
                            {lic.full_name || '—'}
                          </p>
                          <p className="text-xs text-gray-500 font-mono md:hidden truncate">
                            {lic.license_number}
                          </p>
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white text-xs font-bold"
                            style={{ backgroundColor: lic.color_hex }}
                            title={localizedTypeName}
                          >
                            {lic.license_type_code.replace('_', '-')}
                          </span>
                        </td>
                        <td className="py-3 pr-3 font-mono text-xs text-gray-600 hidden md:table-cell">
                          {lic.license_number}
                        </td>
                        <td className="py-3 pr-3 text-gray-600 hidden lg:table-cell">
                          {lic.region || '—'}
                        </td>
                        <td className="py-3 pr-3 text-gray-600 hidden md:table-cell">
                          {formatDate(lic.issued_at, locale)}
                        </td>
                        <td className="py-3 pr-3 text-gray-600 hidden md:table-cell">
                          {formatDate(lic.expires_at, locale)}
                        </td>
                        <td className="py-3 pr-3 text-right">
                          <Link
                            href={lic.verification_url}
                            className="inline-flex p-1.5 rounded hover:bg-blue-50"
                            title="QR / Verify"
                          >
                            <QrCode className="w-4 h-4 text-gray-400 hover:text-[#1A56A0]" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && data && data.count > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {locale === 'ru'
                ? `Страница ${page} из ${totalPages}`
                : `Sahifa ${page} / ${totalPages}`}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PublicLicensesTable;
