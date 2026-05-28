'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/lib/logger';

/*
! React class ErrorBoundary — catches render-time errors in child tree.
! Use to wrap interactive regions (study/chunk pages) so a broken hook
! does not produce a blank screen.
!
! NOT a substitute for Next.js error.tsx route boundaries. Use alongside.
*/

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('ErrorBoundary caught render error', {
      context: this.props.context,
      error,
      componentStack: info.componentStack,
    });
  }

  reset = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        className="container py-8 max-w-xl mx-auto text-center"
      >
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          An unexpected error occurred while rendering this view. Try again or go back.
        </p>
        <div className="flex justify-center gap-2">
          <button
            onClick={this.reset}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-4 py-2 rounded-md border border-input hover:bg-secondary"
          >
            Home
          </a>
        </div>
      </div>
    );
  }
}
