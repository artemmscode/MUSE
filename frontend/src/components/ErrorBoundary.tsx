import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('MUSE crashed', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <h1 className="mt-10 font-display text-[28px] font-medium tracking-[-0.04em] text-bone-50">
            Something went quiet.
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-bone-400">
            MUSE hit an unexpected error. Your library is safe in Supabase.
          </p>
          <p className="mt-2 break-words text-[11px] text-bone-600">{this.state.message}</p>
          <Button className="mt-7" onClick={() => window.location.reload()}>
            Reload MUSE
          </Button>
        </div>
      </div>
    );
  }
}
