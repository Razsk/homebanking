declare const __non_webpack_require__: any;

export async function register() {
  // Server-side instrumentation registration
}

export async function onRequestError(
  err: any,
  request: {
    path: string;
    method: string;
    headers: any;
  },
  context: {
    routerKind: string;
    routePath: string;
    routeType: string;
    renderSource?: string;
  }
) {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    // Use dynamic runtime require to avoid Webpack Edge bundle static analysis
    const req = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : eval('require');
    const { recordDevError } = req('./lib/dev-error-tracker');
    if (typeof recordDevError === 'function') {
      recordDevError({
        name: err?.name || 'ServerError',
        message: err?.message || String(err),
        stack: err?.stack,
        source: 'server',
        route: request?.path || context?.routePath || '/',
        metadata: {
          method: request?.method,
          routeType: context?.routeType,
          routerKind: context?.routerKind,
          renderSource: context?.renderSource,
          digest: err?.digest
        }
      });
    }
  } catch (e) {
    console.error('[Instrumentation] Failed to record dev error:', e);
  }
}
