import { NavLink, useNavigate } from 'react-router-dom';
import {
  Clock3,
  Disc3,
  Home,
  Library,
  ListMusic,
  LogOut,
  Plus,
  Settings,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { CoverArt } from '@/components/ui/CoverArt';
import { useLibraryStore } from '@/stores/libraryStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from '@/stores/toastStore';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/library', label: 'Your Library', icon: Library },
  { to: '/recent', label: 'Recently Added', icon: Clock3 },
  { to: '/playlists', label: 'Playlists', icon: ListMusic },
];

export function Sidebar() {
  const playlists = useLibraryStore((state) => state.playlists);
  const { user } = useAuth();
  const navigate = useNavigate();

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Listener';
  const initial = displayName.slice(0, 1).toUpperCase();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Could not sign out', error.message);
      return;
    }
    navigate('/login', { replace: true });
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-white/[0.06] bg-ink-950/55 px-4 pb-5 pt-6 backdrop-blur-xl lg:flex">
      <div className="px-2">
        <Logo />
      </div>

      <nav className="mt-9 space-y-0.5" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-300',
                  isActive
                    ? 'bg-white/[0.055] text-bone-50'
                    : 'text-bone-400 hover:bg-white/[0.03] hover:text-bone-100',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute -left-1 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-accent" />
                  )}
                  <Icon
                    className={cn(
                      'h-[17px] w-[17px] transition-colors',
                      isActive ? 'text-accent' : 'text-bone-500 group-hover:text-bone-300',
                    )}
                    strokeWidth={1.8}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
        <div className="mb-2 flex items-center justify-between px-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-bone-600">
            Your playlists
          </p>
          <button
            type="button"
            onClick={() => navigate('/playlists?new=1')}
            aria-label="Create playlist"
            className="flex h-6 w-6 items-center justify-center rounded-full text-bone-600 transition-colors hover:bg-white/[0.06] hover:text-bone-200"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {playlists.length === 0 ? (
          <p className="px-3 py-2 text-[11.5px] leading-relaxed text-bone-600">
            Playlists you create will appear here.
          </p>
        ) : (
          <div className="space-y-0.5">
            {playlists.slice(0, 6).map((playlist) => (
              <NavLink
                key={playlist.id}
                to={`/playlists/${playlist.id}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] transition-colors',
                    isActive
                      ? 'bg-white/[0.045] text-bone-100'
                      : 'text-bone-500 hover:bg-white/[0.03] hover:text-bone-200',
                  )
                }
              >
                <CoverArt
                  src={playlist.cover_url ?? playlist.preview_covers[0] ?? null}
                  title={playlist.name}
                  className="h-6 w-6 shrink-0"
                  rounded="rounded-[5px]"
                />
                <span className="truncate">{playlist.name}</span>
              </NavLink>
            ))}
          </div>
        )}

        {playlists.length > 0 && (
          <NavLink
            to="/playlists"
            className="mt-2 block px-3 text-[10.5px] font-medium uppercase tracking-[0.14em] text-bone-600 transition-colors hover:text-bone-300"
          >
            All playlists
          </NavLink>
        )}
      </div>

      <div className="mt-4 space-y-1 border-t border-white/[0.06] pt-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors',
              isActive
                ? 'bg-white/[0.055] text-bone-50'
                : 'text-bone-400 hover:bg-white/[0.03] hover:text-bone-100',
            )
          }
        >
          <Settings className="h-[17px] w-[17px] text-bone-500" strokeWidth={1.8} />
          Settings
        </NavLink>

        <div className="mt-2 flex items-center gap-2.5 rounded-xl px-2 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.045] text-[11px] font-medium text-bone-200">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-bone-200">{displayName}</p>
            <p className="mt-0.5 text-[9.5px] uppercase tracking-[0.14em] text-bone-600">
              Private library
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-bone-600 transition-colors hover:bg-white/[0.06] hover:text-bone-200"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between px-3 pt-2">
          <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.16em] text-bone-700">
            <Disc3 className="h-3 w-3" />
            MUSE 1.0
          </span>
          <span className="h-1 w-1 rounded-full bg-accent/40" />
        </div>
      </div>
    </aside>
  );
}
