// Cookie ga yozish — middleware o'qiy oladi
export function saveAdminTokens(access: string, refresh: string, user: any) {
  // Cookie ga yozamiz (middleware uchun)
  document.cookie = `adminAccessToken=${access}; path=/; max-age=900; SameSite=Strict`;
  document.cookie = `adminRefreshToken=${refresh}; path=/; max-age=2592000; SameSite=Strict`;

  // localStorage ga ham (hook uchun)
  localStorage.setItem('adminAccessToken', access);
  localStorage.setItem('adminRefreshToken', refresh);
  localStorage.setItem('adminUser', JSON.stringify(user));
}

export function clearAdminTokens() {
  // Cookie ni o'chirish
  document.cookie = 'adminAccessToken=; path=/; max-age=0';
  document.cookie = 'adminRefreshToken=; path=/; max-age=0';

  // localStorage ni tozalash
  localStorage.removeItem('adminAccessToken');
  localStorage.removeItem('adminRefreshToken');
  localStorage.removeItem('adminUser');
}

export function getAdminToken(): string | null {
  return localStorage.getItem('adminAccessToken');
}

export function getAdminUser(): any | null {
  try {
    const raw = localStorage.getItem('adminUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
