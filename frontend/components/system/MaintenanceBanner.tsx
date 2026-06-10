"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";

interface MaintenanceStatus {
  maintenance_mode: boolean;
  system_name?: string;
  updated_at?: string | null;
}

const POLL_INTERVAL_MS = 30_000;

export default function MaintenanceBanner() {
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/maintenance-status", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as MaintenanceStatus;
      setStatus(data);
    } catch {
      // tinch o'tkazib yuboramiz
    }
  }, []);

  useEffect(() => {
    // Admin tokeni mavjudligini tekshirish (admin/oddiy user banneri farqi uchun)
    try {
      // Faqat /admin/login orqali kirgan adminlarni admin deb hisoblaymiz.
      const adminToken = localStorage.getItem("adminAccessToken");
      setIsAdmin(Boolean(adminToken));
    } catch {
      setIsAdmin(false);
    }

    fetchStatus();
    const id = window.setInterval(fetchStatus, POLL_INTERVAL_MS);

    // Sozlamalar saqlanganda darhol yangilash
    const handler = () => fetchStatus();
    window.addEventListener("maintenance:changed", handler);
    window.addEventListener("focus", handler);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("maintenance:changed", handler);
      window.removeEventListener("focus", handler);
    };
  }, [fetchStatus]);

  // Banner ko'rsatilganda dismiss bekor bo'ladi (yangi yoqilganda yana paydo bo'ladi)
  useEffect(() => {
    if (status?.maintenance_mode) {
      const lastSeen = sessionStorage.getItem("maintenance:dismissedAt");
      const updatedAt = status.updated_at ?? "";
      if (lastSeen !== updatedAt) {
        setDismissed(false);
      } else {
        setDismissed(true);
      }
    } else {
      setDismissed(false);
    }
  }, [status?.maintenance_mode, status?.updated_at]);

  if (!status?.maintenance_mode || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (status.updated_at) {
      sessionStorage.setItem("maintenance:dismissedAt", status.updated_at);
    }
  };

  const baseClasses =
    "fixed top-0 inset-x-0 z-[9999] border-b shadow-sm backdrop-blur supports-[backdrop-filter]:bg-opacity-95 animate-in slide-in-from-top duration-300";

  if (isAdmin) {
    return (
      <div
        className={`${baseClasses} bg-amber-50 border-amber-300 text-amber-900`}
        role="status"
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-semibold">Texnik xizmat rejimi yoqilgan.</span>{" "}
            <span className="opacity-90">
              Oddiy foydalanuvchilar tizimga kira olmaydi. Siz administrator
              sifatida to&apos;liq kirish huquqiga egasiz.
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-amber-100 transition"
            aria-label="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} bg-red-50 border-red-300 text-red-900`}
      role="alert"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
        <div className="flex-1 text-sm">
          <span className="font-semibold">
            Tizim texnik xizmat rejimida.
          </span>{" "}
          <span className="opacity-90">
            Ba&apos;zi xizmatlar vaqtinchalik mavjud bo&apos;lmasligi mumkin.
            Iltimos, keyinroq urinib ko&apos;ring.
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-red-100 transition"
          aria-label="Yopish"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
