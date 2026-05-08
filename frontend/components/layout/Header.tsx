'use client';

import Link from 'next/link';
import { Bell, User, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-4 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F39C12] rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-white">UFF</span>
          </div>
          <span className="hidden md:block font-semibold text-[#0D3B6E]">
            Murabbiy Portal
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User menu */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.full_name || 'Foydalanuvchi'}
              </p>
              <p className="text-xs text-gray-500">{user?.role || 'Murabbiy'}</p>
            </div>
            <div className="w-10 h-10 bg-[#1A56A0] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="text-gray-500 hover:text-red-500">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
