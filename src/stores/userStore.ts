import { create } from 'zustand';
import { supabase } from '../services/supabase/client';

interface UserStore {
  user: any | null;
  setUser: (user: any | null) => void;
  initialize: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ user: session?.user ?? null });
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
  },
}));