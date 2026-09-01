export async function register() {
  // Initialization for server instrumentation
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
    const { recordDevError } = await import('./lib/dev-error-tracker');
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
  } catch (e) {
    console.error('[Instrumentation] Failed to record dev error:', e);
  }
}
