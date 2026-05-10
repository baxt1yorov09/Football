'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function AdminDashboard() {
  const { admin, isLoading, isAuthorized, logout } = useAdminAuth();

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1A56A0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Tekshirilmoqda...</p>
        </div>
      </div>
    );
  }

  // Authorized bo'lmasa — hook o'zi redirect qiladi
  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-[#F4F6F9] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#0D3B6E]">
            Admin Dashboard
          </h1>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
          >
            Logout
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-4">
            Xush kelibsiz, {admin?.full_name}! 👋
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900">Role</h3>
              <p className="text-blue-700 mt-1">{admin?.role}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-green-900">Email</h3>
              <p className="text-green-700 mt-1">{admin?.email}</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-purple-900">Region</h3>
              <p className="text-purple-700 mt-1">{admin?.region || 'All'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
