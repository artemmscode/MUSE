import { useEffect } from 'react';

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} — MUSE` : 'MUSE — Private Music Library';
  }, [title]);
}
