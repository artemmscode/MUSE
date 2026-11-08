import { supabase } from '@/lib/supabase';
import { getTelegramWebApp } from './telegram';

interface TelegramAuthResponse {
  token_hash: string;
  email: string;
}

/**
 * Signs in through the `telegram-auth` Supabase Edge Function.
 * The function verifies Telegram initData with HMAC-SHA256 and the bot token.
 */
export async function signInWithTelegram(): Promise<void> {
  const initData = getTelegramWebApp()?.initData;
  if (!initData) {
    throw new Error('Telegram sign-in is only available inside the Telegram Mini App.');
  }

  const { data, error } = await supabase.functions.invoke<TelegramAuthResponse>(
    'telegram-auth',
    { body: { initData } },
  );

  if (error) {
    throw new Error(
      error.message ||
        'Telegram sign-in is not configured yet. Deploy the telegram-auth Edge Function.',
    );
  }
  if (!data?.token_hash) {
    throw new Error('Telegram did not return a valid session.');
  }

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: data.token_hash,
    type: 'magiclink',
  });
  if (verifyError) throw verifyError;
}
