import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/lib/supabase';
import { errorMessage } from '@/lib/errors';
import { toast } from '@/stores/toastStore';

export function ResetPasswordPage() {
  useDocumentTitle('Reset password');
  const navigate = useNavigate();
  const { session, initialized } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      toast.success('Password updated', 'You are signed in with your new password.');
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not update the password.'));
    } finally {
      setLoading(false);
    }
  };

  if (!initialized) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="safe-top safe-bottom flex min-h-dvh flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-[400px] text-center">
          <Logo />
          <div className="mx-auto mt-12 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
            <KeyRound className="h-5 w-5 text-accent" />
          </div>
          <h1 className="mt-6 font-display text-[30px] font-medium tracking-[-0.045em] text-bone-50">
            This link has expired.
          </h1>
          <p className="mt-3 text-[12.5px] leading-relaxed text-bone-500">
            Password reset links are single-use and time-limited. Request a new one from the sign-in
            screen.
          </p>
          <Button className="mt-7 w-full" onClick={() => navigate('/login', { replace: true })}>
            Back to sign in
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="safe-top safe-bottom flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px]"
      >
        <Logo />

        <div className="mt-12">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-bone-500">
            Password recovery
          </p>
          <h1 className="mt-3 font-display text-[32px] font-medium tracking-[-0.045em] text-bone-50">
            Choose a new password.
          </h1>
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-bone-500">
            Your recovery link was verified. Set a new password to finish signing in.
          </p>

          <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 space-y-4">
            <Input
              label="New password"
              type={showPassword ? 'text' : 'password'}
              name="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              icon={<Lock className="h-4 w-4" />}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="rounded-full p-1 text-bone-500 transition-colors hover:text-bone-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
            />

            <Input
              label="Confirm password"
              type={showPassword ? 'text' : 'password'}
              name="confirm-password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Repeat the password"
              icon={<ShieldCheck className="h-4 w-4" />}
              required
            />

            {error && (
              <p className="rounded-xl border border-[#5a2a2a]/60 bg-[#2a1717]/60 px-3.5 py-3 text-[11.5px] leading-relaxed text-[#e0a7a7]">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Update password
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </form>

          <button
            type="button"
            onClick={() => void supabase.auth.signOut().then(() => navigate('/login'))}
            className="mt-5 text-[11.5px] text-bone-500 transition-colors hover:text-bone-200"
          >
            Cancel and sign out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
