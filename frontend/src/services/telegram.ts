import type { TelegramWebApp } from '@/types';

export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function isTelegramMiniApp(): boolean {
  const app = getTelegramWebApp();
  return Boolean(app?.initData);
}

let initialized = false;

/**
 * Initialises the official Telegram WebApp SDK (loaded in index.html).
 * Safe to call outside Telegram — every call is guarded.
 */
export function initTelegram(): void {
  const app = getTelegramWebApp();
  if (!app || initialized) return;
  initialized = true;

  try {
    app.ready();
    app.expand();
    app.setHeaderColor('#070708');
    app.setBackgroundColor('#070708');
    app.disableVerticalSwipes?.();
  } catch {
    // Older Telegram clients may not support every method.
  }

  const syncViewport = () => {
    document.documentElement.style.setProperty(
      '--tg-viewport-height',
      `${app.viewportStableHeight || app.viewportHeight}px`,
    );
    const top = app.contentSafeAreaInset?.top ?? app.safeAreaInset?.top ?? 0;
    const bottom = app.contentSafeAreaInset?.bottom ?? app.safeAreaInset?.bottom ?? 0;
    document.documentElement.style.setProperty('--tg-safe-top', `${top}px`);
    document.documentElement.style.setProperty('--tg-safe-bottom', `${bottom}px`);
  };

  syncViewport();
  app.onEvent('viewportChanged', syncViewport);

  if (isTelegramMiniApp()) {
    document.documentElement.classList.add('tg-miniapp');
  }
}

// The SDK is loaded asynchronously from index.html; initialise it whenever it
// arrives, even if the app booted first.
if (typeof window !== 'undefined') {
  window.addEventListener('muse:telegram-ready', () => initTelegram());
}

export function telegramHaptic(
  type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection' = 'light',
): void {
  const haptics = getTelegramWebApp()?.HapticFeedback;
  if (!haptics) return;
  try {
    if (type === 'success' || type === 'error') {
      haptics.notificationOccurred(type);
    } else if (type === 'selection') {
      haptics.selectionChanged();
    } else {
      haptics.impactOccurred(type);
    }
  } catch {
    // Haptics are a progressive enhancement.
  }
}

export function setTelegramBackButton(visible: boolean, onClick?: () => void): () => void {
  const backButton = getTelegramWebApp()?.BackButton;
  if (!backButton) return () => undefined;

  const handler = () => onClick?.();
  try {
    if (visible) {
      backButton.onClick(handler);
      backButton.show();
    } else {
      backButton.hide();
    }
  } catch {
    return () => undefined;
  }

  return () => {
    try {
      backButton.offClick(handler);
    } catch {
      // no-op
    }
  };
}
