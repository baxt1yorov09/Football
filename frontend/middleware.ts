import { NextRequest, NextResponse } from 'next/server';

// Admin sahifalar uchun himoya
const ADMIN_PATHS = ['/admin'];
const ADMIN_LOGIN_PATH = '/admin/login';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin yo'llarini tekshiramiz
  const isAdminPath = ADMIN_PATHS.some(path =>
    pathname.startsWith(path)
  );

  if (!isAdminPath) return NextResponse.next();

  // Login, forgot-password va reset-password sahifalariga ruxsat
  if (
    pathname === ADMIN_LOGIN_PATH ||
    pathname === '/admin/forgot-password' ||
    pathname.startsWith('/admin/reset-password')
  ) {
    return NextResponse.next();
  }

  // Cookie dan token tekshiramiz (localStorage server da o'qilmaydi)
  const adminToken = request.cookies.get('adminAccessToken')?.value;

  if (!adminToken) {
    // Token yo'q — login sahifasiga yo'naltir
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
