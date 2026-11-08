import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Not found');

  return (
    <div className="flex min-h-[58vh] flex-col items-center justify-center text-center">
      <p className="font-serif text-[96px] leading-none tracking-[-0.04em] text-bone-600/60">404</p>
      <h1 className="mt-4 font-display text-[26px] font-medium tracking-[-0.04em] text-bone-100">
        This page is silent.
      </h1>
      <p className="mt-2 max-w-sm text-[12.5px] leading-relaxed text-bone-500">
        The link may be old, or the track may have left your library.
      </p>
      <Link
        to="/"
        className="mt-7 inline-flex h-10 items-center gap-2 rounded-full bg-bone-100 px-4 text-[12.5px] font-medium text-ink-950 transition-colors hover:bg-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to MUSE
      </Link>
    </div>
  );
}
