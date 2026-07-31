'use client';

import { usePathname } from 'next/navigation';

// Watermark faqat admin panel va foydalanuvchining shaxsiy panelida ko'rinadi.
// Admin auth sahifalari (login/parolni tiklash) bundan mustasno.
const ADMIN_PREFIX = '/admin';
const ADMIN_EXCLUDE = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];
const USER_PANEL_PREFIXES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/licenses',
  '/notifications',
  '/applications',
];

function shouldShow(pathname: string): boolean {
  if (pathname.startsWith(ADMIN_PREFIX)) {
    return !ADMIN_EXCLUDE.some((p) => pathname.startsWith(p));
  }
  return USER_PANEL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function Watermark() {
  const pathname = usePathname();

  if (!pathname || !shouldShow(pathname)) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] flex items-center justify-center"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fmtm-logo.svg"
        alt=""
        className="w-[40vw] max-w-[520px] opacity-[0.05] select-none"
      />
    </div>
  );
}
