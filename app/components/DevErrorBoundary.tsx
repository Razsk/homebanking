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
  metadata?: Record<string, any>;
}) {
  if (
    process.env.NODE_ENV !== 'development' &&
    typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost')
  ) {
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
 * Global window listeners with capture=true to catch uncaught JS errors,
 * unhandled promise rejections, AND resource load errors (e.g. script 500s).
 */
function GlobalDevErrorListener() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const handleWindowError = (event: Event | ErrorEvent) => {
      const target = event.target as HTMLElement | null;
      const isResource =
        target &&
        (target.tagName === 'SCRIPT' ||
          target.tagName === 'LINK' ||
          target.tagName === 'IMG' ||
          target.tagName === 'SOURCE');

      if (isResource) {
        const src =
          (target as HTMLScriptElement).src ||
          (target as HTMLLinkElement).href ||
          '';

        if (!src) return;

        reportErrorToDevApi({
          name: 'ResourceLoadError',
          message: `Failed to load resource: ${src} (Server Responded with Error)`,
          stack: `Resource load failed on element <${target.tagName.toLowerCase()}> at ${src}`,
          source: 'build',
          route: window.location.pathname,
          metadata: { resourceUrl: src, tagName: target.tagName }
        });
        return;
      }

      const errEvent = event as ErrorEvent;
      reportErrorToDevApi({
        name: errEvent.error?.name || 'UncaughtError',
        message: errEvent.message || 'Unknown window error',
        stack: errEvent.error?.stack,
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

    // Use capture phase (true) so resource errors on <script>/<link> elements are captured
    window.addEventListener('error', handleWindowError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError, true);
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
