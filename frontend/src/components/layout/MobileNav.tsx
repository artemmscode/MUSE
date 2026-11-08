import { NavLink } from 'react-router-dom';
import { Clock3, Home, Library, ListMusic, Search, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/playlists', label: 'Playlists', icon: ListMusic },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function MobileNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-ink-950/90 backdrop-blur-2xl lg:hidden"
    >
      <div className="grid h-[62px] grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center justify-center gap-1 text-[9px] font-medium tracking-wide transition-colors',
                  isActive ? 'text-accent-soft' : 'text-bone-500',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 h-[2px] w-6 rounded-full bg-accent/80" />
                  )}
                  <Icon
                    className={cn('h-[19px] w-[19px]', isActive && 'text-accent')}
                    strokeWidth={isActive ? 2 : 1.7}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export function RecentlyNavItem() {
  return (
    <NavLink
      to="/recent"
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 text-[10px] uppercase tracking-[0.16em]',
          isActive ? 'text-bone-100' : 'text-bone-500',
        )
      }
    >
      <Clock3 className="h-3 w-3" />
      Recently added
    </NavLink>
  );
}
