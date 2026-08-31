'use client';

import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

async function reportErrorToDevApi(data: {
  name: string;
  message: string;
  stack?: string;
  source: string;
  route?: string;
}) {
  if (process.env.NODE_ENV !== 'development' && typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return;
  }

  try {
    await fetch('/api/dev/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        route: data.route || (typeof window !== 'undefined' ? window.location.pathname : undefined)
      })
    });
  } catch (err) {
    // Silently handle if dev error reporting itself fails
  }
}

/**
 * Global window listeners for uncaught errors and unhandled promise rejections in dev.
 */
function GlobalDevErrorListener() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const handleWindowError = (event: ErrorEvent) => {
      reportErrorToDevApi({
        name: event.error?.name || 'UncaughtError',
        message: event.message || 'Unknown window error',
        stack: event.error?.stack,
        source: 'client',
        route: window.location.pathname
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      reportErrorToDevApi({
        name: reason?.name || 'UnhandledPromiseRejection',
        message: typeof reason === 'string' ? reason : reason?.message || 'Unhandled Promise rejection',
        stack: reason?.stack,
        source: 'client',
        route: window.location.pathname
      });
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}

export class DevErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportErrorToDevApi({
      name: error.name || 'ReactRenderError',
      message: error.message,
      stack: `${error.stack || ''}\nComponent Stack:${errorInfo.componentStack || ''}`,
      source: 'client'
    });
  }

  render() {
    return (
      <>
        <GlobalDevErrorListener />
        {this.props.children}
      </>
    );
  }
}
