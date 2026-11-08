import { Logo } from '@/components/ui/Logo';

export function SplashScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-ink-950">
      <div className="animate-pulse-soft">
        <Logo />
      </div>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-1 w-1 animate-pulse rounded-full bg-bone-600"
            style={{ animationDelay: `${index * 180}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
