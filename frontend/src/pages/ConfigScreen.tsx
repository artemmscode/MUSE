import { ArrowUpRight, Database, KeyRound, TerminalSquare } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const steps = [
  {
    icon: Database,
    title: 'Create a Supabase project',
    body: 'Run the SQL migrations from supabase/migrations in the SQL editor.',
  },
  {
    icon: KeyRound,
    title: 'Add your public keys',
    body: 'Copy the Project URL and anon key into frontend/.env.',
  },
  {
    icon: TerminalSquare,
    title: 'Restart the dev server',
    body: 'Run npm run dev again — Vite only reads env files at startup.',
  },
];

export function ConfigScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-[760px]">
        <Logo />
        <p className="mt-12 text-[10px] font-medium uppercase tracking-[0.24em] text-accent">
          Configuration required
        </p>
        <h1 className="mt-4 text-balance font-display text-[38px] font-medium leading-[1.03] tracking-[-0.045em] text-bone-50 sm:text-[52px]">
          Connect MUSE to your Supabase project.
        </h1>
        <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-bone-400">
          The interface is ready. Add the two public environment variables below and restart
          Vite. Your anon key is safe in the browser as long as Row Level Security is enabled
          by the migrations.
        </p>

        <div className="mt-9 overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900/70">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <span className="h-2 w-2 rounded-full bg-[#5a3a3a]" />
            <span className="h-2 w-2 rounded-full bg-[#4a4432]" />
            <span className="h-2 w-2 rounded-full bg-[#2f4634]" />
            <span className="ml-2 text-[10px] uppercase tracking-[0.16em] text-bone-600">
              frontend/.env
            </span>
          </div>
          <pre className="overflow-x-auto px-5 py-5 text-[12.5px] leading-7 text-bone-300">
            <code>
              <span className="text-bone-600">VITE_SUPABASE_URL</span>
              {'='}
              <span className="text-accent-soft">https://your-project.supabase.co</span>
              {'\n'}
              <span className="text-bone-600">VITE_SUPABASE_ANON_KEY</span>
              {'='}
              <span className="text-accent-soft">your-anon-key</span>
              {'\n'}
              <span className="text-bone-600">VITE_TELEGRAM_BOT_USERNAME</span>
              {'='}
              <span className="text-accent-soft">your_bot</span>
            </code>
          </pre>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-4"
              >
                <Icon className="h-4 w-4 text-accent" strokeWidth={1.6} />
                <p className="mt-3 text-[12.5px] font-medium text-bone-100">{step.title}</p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-bone-500">{step.body}</p>
              </div>
            );
          })}
        </div>

        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-1.5 text-[12px] text-bone-400 transition-colors hover:text-bone-100"
        >
          Read the full setup guide in README.md
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
