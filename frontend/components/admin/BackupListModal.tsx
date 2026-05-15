'use client';

/**
 * Backup ro'yxatini ko'rsatuvchi modal.
 * Admin har bir backup'ni yuklab olishi yoki o'chirishi mumkin.
 */
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  HardDrive,
  Download,
  Trash2,
  Calendar,
  RefreshCw,
  Loader2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { adminApi, adminApiDownload } from '@/lib/adminApi';

interface BackupItem {
  name: string;
  size_mb: number;
  created_at: string;
}

interface BackupListResponse {
  backups: BackupItem[];
  total_size_mb: number;
  count: number;
}

interface BackupListModalProps {
  open: boolean;
  onClose: () => void;
  onChange?: () => void; // chaqiruvchini yangilash uchun (status refresh)
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatSize(mb: number): string {
  if (mb < 1) return `${Math.round(mb * 1024)} KB`;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export function BackupListModal({ open, onClose, onChange }: BackupListModalProps) {
  const [data, setData] = useState<BackupListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [downloadingName, setDownloadingName] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const json = await adminApi<BackupListResponse>('/api/settings/backups');
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchList();
  }, [open, fetchList]);

  const handleDownload = async (name: string) => {
    try {
      setDownloadingName(name);
      const blob = await adminApiDownload(
        `/api/settings/backups/${encodeURIComponent(name)}/download`
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Yuklab olishda xatolik: ${e?.message || e}`);
    } finally {
      setDownloadingName(null);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`"${name}" backupini o'chirmoqchimisiz? Bu amal qaytarilmaydi.`)) return;
    try {
      setDeletingName(name);
      await adminApi(`/api/settings/backups/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      await fetchList();
      onChange?.();
    } catch (e: any) {
      alert(`O'chirishda xatolik: ${e?.message || e}`);
    } finally {
      setDeletingName(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0D3B6E]">Backup'lar ro'yxati</h2>
                  {data && (
                    <p className="text-xs text-gray-500">
                      Jami {data.count} ta fayl ({formatSize(data.total_size_mb)})
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={fetchList}
                  disabled={loading}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Yangilash"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Yopish"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {loading && !data ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <p className="text-sm">Yuklanmoqda...</p>
                </div>
              ) : !data || data.backups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Database className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm font-medium">Hali backup mavjud emas</p>
                  <p className="text-xs mt-1">"Hozir backup yaratish" tugmasini bosing</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.backups.map((b, idx) => {
                    const isDeleting = deletingName === b.name;
                    const isDownloading = downloadingName === b.name;
                    return (
                      <motion.div
                        key={b.name}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Database className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate font-mono text-sm">
                            {b.name}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(b.created_at)}
                            </span>
                            <span className="font-medium">{formatSize(b.size_mb)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleDownload(b.name)}
                            disabled={isDownloading || isDeleting}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Yuklab olish"
                          >
                            {isDownloading ? (
                              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(b.name)}
                            disabled={isDeleting || isDownloading}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                            title="O'chirish"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-600" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl text-xs text-gray-500 flex items-center justify-between">
              <span>Backup'lar tartibi: yangi → eski</span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Yopish
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BackupListModal;
