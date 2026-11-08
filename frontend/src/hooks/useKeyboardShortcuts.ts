import { useEffect } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { isTypingTarget } from '@/lib/utils';

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isTypingTarget(event.target)) return;
      const player = usePlayerStore.getState();

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          player.togglePlay();
          break;
        case 'ArrowRight':
          if (event.shiftKey) {
            event.preventDefault();
            player.next();
          } else {
            event.preventDefault();
            player.seekBy(5);
          }
          break;
        case 'ArrowLeft':
          if (event.shiftKey) {
            event.preventDefault();
            player.previous();
          } else {
            event.preventDefault();
            player.seekBy(-5);
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          player.setVolume(player.volume + 0.05);
          break;
        case 'ArrowDown':
          event.preventDefault();
          player.setVolume(player.volume - 0.05);
          break;
        case 'KeyM':
          event.preventDefault();
          player.toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
