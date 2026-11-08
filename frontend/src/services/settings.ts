import { supabase } from '@/lib/supabase';
import type { Profile, UserSettings } from '@/types';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function ensureSettings(userId: string): Promise<UserSettings> {
  const existing = await fetchSettings(userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ owner_id: userId }, { onConflict: 'owner_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateSettings(
  userId: string,
  patch: Partial<
    Pick<UserSettings, 'display_name' | 'default_volume' | 'autoplay' | 'telegram_user_id'>
  >,
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ owner_id: userId, ...patch }, { onConflict: 'owner_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfileDisplayName(
  userId: string,
  displayName: string,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId);
  if (error) throw error;
}
