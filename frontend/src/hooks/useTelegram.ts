import { useEffect, useState } from 'react';
import { getTelegramWebApp, isTelegramMiniApp } from '@/services/telegram';
import type { TelegramWebAppUser } from '@/types';

export function useTelegram(): {
  isMiniApp: boolean;
  user: TelegramWebAppUser | null;
  platform: string | null;
} {
  const [state, setState] = useState<{
    isMiniApp: boolean;
    user: TelegramWebAppUser | null;
    platform: string | null;
  }>(() => {
    const app = getTelegramWebApp();
    return {
      isMiniApp: isTelegramMiniApp(),
      user: app?.initDataUnsafe?.user ?? null,
      platform: app?.platform ?? null,
    };
  });

  useEffect(() => {
    const app = getTelegramWebApp();
    if (!app) return;
    setState({
      isMiniApp: isTelegramMiniApp(),
      user: app.initDataUnsafe?.user ?? null,
      platform: app.platform ?? null,
    });
  }, []);

  return state;
}
