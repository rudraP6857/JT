import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button.tsx';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-[#E8EBF5]">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-[#8B93AB] max-w-md">
            {this.state.error?.message ||
              'An unexpected error occurred while rendering this view. You can retry to reload the interface.'}
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={this.handleReset}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Retry
            </Button>
            <a href="/">
              <Button variant="secondary" size="md" leftIcon={<Home className="w-4 h-4" />}>
                Go to Dashboard
              </Button>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
