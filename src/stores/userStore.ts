import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase/client';
import { logger } from '../utils/logger';

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  initialize: () => Promise<User | null>;
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
  initialize: async () => {
    try {
      // Wait for initial session check
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;

      set({ user });
      logger.setUser(
        user?.id || null,
        user?.email,
        user?.user_metadata?.name || user?.email?.split('@')[0]
      );

      // Set up auth state listener (still fire-and-forget, that's fine)
      supabase.auth.onAuthStateChange((_event, session) => {
        const user = session?.user ?? null;
        set({ user });
        logger.setUser(
          user?.id || null,
          user?.email,
          user?.user_metadata?.name || user?.email?.split('@')[0]
        );
      });

      return user; // Return user for convenience
    } catch (error) {
      logger.error('Failed to initialize auth:', error);
      return null;
    }
  },
}));