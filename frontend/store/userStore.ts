import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  role: string;
  avatar_url: string | null;
  is_onboarded: boolean;
  job_title: string;
  workplace: string;
  region_name: string;
}

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  updateUser: (fields: Partial<User>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      updateUser: (fields) => set((state) => ({
        user: state.user ? { ...state.user, ...fields } : null,
      })),
    }),
    { name: 'ufa-user' }
  )
);
