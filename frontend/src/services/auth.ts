import { supabase } from '@/lib/supabase';

/**
 * Short logins are expanded to this mailbox, so the owner can sign in with
 * "elvaire" instead of typing the full internal address.
 */
const LOGIN_DOMAIN = 'muse.local';

export function resolveLogin(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.includes('@') ? trimmed : `${trimmed}@${LOGIN_DOMAIN}`;
}

export async function signInWithEmail(login: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: resolveLogin(login),
    password,
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function sendPasswordReset(login: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(resolveLogin(login), {
    redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}reset-password`,
  });
  if (error) throw error;
}
