import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Command, Plus, Search, Send } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { telegramBotUrl } from '@/lib/env';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/hooks/useTelegram';

export function TopBar() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { isMiniApp } = useTelegram();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (window.matchMedia('(min-width: 1024px)').matches) {
          inputRef.current?.focus();
        } else {
          navigate('/search');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  return (
    <header
      className={cn(
        'safe-top sticky top-0 z-30 border-b transition-colors duration-500',
        scrolled
          ? 'border-white/[0.06] bg-ink-950/75 backdrop-blur-2xl'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:px-10">
        <Link to="/" className="lg:hidden" aria-label="MUSE home">
          <Logo compact={isMiniApp} />
        </Link>

        <form
          className="hidden min-w-0 flex-1 lg:block"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            navigate(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search');
          }}
        >
          <div className="group flex h-10 w-full max-w-[420px] items-center gap-2.5 rounded-full border border-white/[0.07] bg-white/[0.025] px-4 transition-colors focus-within:border-white/[0.16] focus-within:bg-white/[0.045]">
            <Search className="h-4 w-4 shrink-0 text-bone-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your library"
              aria-label="Search your library"
              className="h-full min-w-0 flex-1 bg-transparent text-[12.5px] text-bone-100 placeholder:text-bone-600 focus:outline-none"
            />
            <span className="flex items-center gap-0.5 rounded-md border border-white/[0.08] px-1.5 py-0.5 text-[9px] text-bone-600">
              <Command className="h-2.5 w-2.5" />K
            </span>
          </div>
        </form>

        <div className="flex flex-1 items-center justify-end gap-2 lg:flex-none">
          <Link
            to="/search"
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full text-bone-400 transition-colors hover:bg-white/[0.06] hover:text-bone-100 lg:hidden"
          >
            <Search className="h-[18px] w-[18px]" />
          </Link>

          <a
            href={telegramBotUrl}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex h-9 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3.5 text-[12px] font-medium text-bone-200 transition-all duration-300 hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-bone-50"
          >
            <Send className="h-3.5 w-3.5 text-accent" />
            <span className="hidden sm:inline">Add music</span>
            <Plus className="h-3 w-3 text-bone-500 transition-transform duration-300 group-hover:rotate-90 sm:hidden" />
          </a>
        </div>
      </div>
    </header>
  );
}
