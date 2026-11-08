import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  initialized: false,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      loading: false,
      initialized: true,
    }),
  setInitialized: (initialized) => set({ initialized, loading: !initialized }),
}));
