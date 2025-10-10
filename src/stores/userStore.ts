import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase/client';
import { logger } from '../utils/logger';

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  initialize: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => {
    set({ user });
    // Update Sentry user context for error tracking
    logger.setUser(
      user?.id || null,
      user?.email,
      user?.user_metadata?.name || user?.email?.split('@')[0]
    );
  },
  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      set({ user });
      // Set initial Sentry user context
      logger.setUser(
        user?.id || null,
        user?.email,
        user?.user_metadata?.name || user?.email?.split('@')[0]
      );
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      set({ user });
      // Update Sentry user context on auth changes
      logger.setUser(
        user?.id || null,
        user?.email,
        user?.user_metadata?.name || user?.email?.split('@')[0]
      );
    });
  },
}));