import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Send, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useTelegram } from '@/hooks/useTelegram';
import { signInWithEmail, sendPasswordReset } from '@/services/auth';
import { signInWithTelegram } from '@/services/telegramAuth';
import { toast } from '@/stores/toastStore';
import { errorMessage } from '@/lib/errors';
import { telegramBotUrl } from '@/lib/env';

interface LocationState {
  from?: string;
}

/**
 * `from` is captured from the URL, which the GitHub Pages fallback used to
 * leave with a double slash (`//login`). Only same-origin absolute paths are
 * accepted, and auth pages are never a valid post-sign-in destination.
 */
function resolveRedirectTarget(from: string | undefined): string {
  if (!from || !from.startsWith('/') || from.startsWith('//')) return '/';
  if (/^\/(login|reset-password)(?:[?#]|$)/.test(from)) return '/';
  return from;
}

export function LoginPage() {
  useDocumentTitle('Sign in');
  const navigate = useNavigate();
  const location = useLocation();
  const { isMiniApp, user: telegramUser } = useTelegram();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'reset'>('signin');

  const redirectTo = resolveRedirectTarget((location.state as LocationState | null)?.from);

  useEffect(() => {
    setError(null);
  }, [mode]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (mode === 'reset') {
      if (!email.trim()) {
        setError('Enter your login or email.');
        return;
      }
      setLoading(true);
      try {
        await sendPasswordReset(email);
        toast.success('Reset link sent', 'Check your inbox, then return to sign in.');
        setMode('signin');
      } catch (err) {
        setError(errorMessage(err, 'Could not send the reset email.'));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password) {
      setError('Enter your login and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Sign in failed. Check your credentials and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramSignIn = async () => {
    setError(null);
    setTelegramLoading(true);
    try {
      await signInWithTelegram();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Telegram sign-in failed.'));
    } finally {
      setTelegramLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden border-r border-white/[0.06] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 top-1/4 h-[520px] w-[520px] rounded-full bg-accent/[0.055] blur-[100px]" />
          <div className="absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-white/[0.025] blur-[100px]" />
          <div className="absolute left-[18%] top-[22%] h-[420px] w-[420px] rounded-full border border-white/[0.055]" />
          <div className="absolute left-[26%] top-[30%] h-[260px] w-[260px] rounded-full border border-white/[0.06]" />
          <div className="absolute left-[34%] top-[38%] h-[110px] w-[110px] rounded-full border border-accent/[0.12]" />
          <div className="absolute left-[38.5%] top-[42.5%] h-[34px] w-[34px] rounded-full bg-accent/[0.16] blur-[2px]" />
        </div>

        <Logo />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-accent">
            Private music library
          </p>
          <h1 className="mt-5 text-balance font-display text-[56px] font-medium leading-[0.98] tracking-[-0.055em] text-bone-50 xl:text-[68px]">
            Music, kept
            <span className="block font-serif font-normal italic tracking-[-0.02em] text-accent-soft">
              close.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-[13.5px] leading-relaxed text-bone-400">
            Send a track to Telegram. It arrives here — with its cover, its metadata and, when
            the artist allows it, its audio. Nothing is public. Nothing is borrowed.
          </p>
        </motion.div>

        <div className="flex items-center gap-3 text-[10.5px] uppercase tracking-[0.16em] text-bone-600">
          <ShieldCheck className="h-3.5 w-3.5 text-accent/70" />
          Row Level Security · private storage · signed playback
        </div>
      </section>

      <section className="safe-top safe-bottom flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="lg:hidden">
            <Logo />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 lg:mt-0"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-bone-500">
              {mode === 'reset' ? 'Password recovery' : 'Welcome back'}
            </p>
            <h2 className="mt-3 font-display text-[32px] font-medium tracking-[-0.045em] text-bone-50">
              {mode === 'reset'
                ? 'Reset your password.'
                : telegramUser?.first_name
                  ? `Hello, ${telegramUser.first_name}.`
                  : 'Sign in to MUSE.'}
            </h2>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-bone-500">
              {mode === 'reset'
                ? 'We will email you a secure link to choose a new password.'
                : 'This library is private. Use the account you created in Supabase.'}
            </p>

            <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 space-y-4">
              <Input
                label="Email or login"
                type="text"
                inputMode="email"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="elvaire"
                icon={<Mail className="h-4 w-4" />}
                required
              />

              {mode === 'signin' && (
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••••"
                  icon={<Lock className="h-4 w-4" />}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="rounded-full p-1 text-bone-500 transition-colors hover:text-bone-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  required
                />
              )}

              {error && (
                <p className="rounded-xl border border-[#5a2a2a]/60 bg-[#2a1717]/60 px-3.5 py-3 text-[11.5px] leading-relaxed text-[#e0a7a7]">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" loading={loading}>
                {mode === 'reset' ? 'Send reset link' : 'Sign in'}
                {mode === 'signin' && <ArrowRight className="h-3.5 w-3.5" />}
              </Button>
            </form>

            {mode === 'signin' ? (
              <>
                {isMiniApp && (
                  <>
                    <div className="my-6 flex items-center gap-3">
                      <span className="h-px flex-1 bg-white/[0.07]" />
                      <span className="text-[9.5px] uppercase tracking-[0.18em] text-bone-600">
                        or
                      </span>
                      <span className="h-px flex-1 bg-white/[0.07]" />
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full"
                      loading={telegramLoading}
                      onClick={() => void handleTelegramSignIn()}
                    >
                      <Send className="h-3.5 w-3.5 text-accent" />
                      Continue with Telegram
                    </Button>
                  </>
                )}

                <div className="mt-5 flex items-center justify-between text-[11.5px]">
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-bone-500 transition-colors hover:text-bone-200"
                  >
                    Forgot password?
                  </button>
                  <a
                    href={telegramBotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-bone-500 transition-colors hover:text-bone-200"
                  >
                    Open MUSE Bot
                  </a>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="mt-5 text-[11.5px] text-bone-500 transition-colors hover:text-bone-200"
              >
                Back to sign in
              </button>
            )}

            <p className="mt-10 border-t border-white/[0.06] pt-5 text-[10.5px] leading-relaxed text-bone-600">
              Accounts are created manually in Supabase Auth. There is no public sign-up — by
              design. If you need help, follow the setup guide in the repository README.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
