import "./globals.css";
import { Sidebar } from "./components/Sidebar";
import { DevErrorBoundary } from "./components/DevErrorBoundary";

export const metadata = {
  title: "Nordea Open Banking & Finansiel Oversigt",
  description: "Personlig finansiel dashboard med Enable Banking PSD2 integration og automatisk abonnementsdetektion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da">
      <head>
        {process.env.NODE_ENV === "development" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  if (typeof window === 'undefined') return;
                  
                  function report(data) {
                    try {
                      fetch('/api/dev/errors', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                      }).catch(function() {});
                    } catch(e) {}
                  }

                  // 1. Capture-phase resource and chunk load errors (script/link/img 404/500/ERR_ABORTED)
                  window.addEventListener('error', function(event) {
                    try {
                      var target = event.target || event.srcElement;
                      var isResource = target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK' || target.tagName === 'IMG');
                      if (isResource) {
                        var src = target.src || target.href || '';
                        if (!src || src.indexOf('/api/dev/errors') !== -1) return;
                        report({
                          name: 'ResourceLoadError',
                          message: 'Failed to load resource: ' + src + ' (Network / 404 / 500 error)',
                          stack: 'Resource load failed on <' + target.tagName.toLowerCase() + '> at ' + src,
                          source: 'build',
                          route: window.location.pathname,
                          metadata: { resourceUrl: src, tagName: target.tagName }
                        });
                        return;
                      }
                      if (event.message) {
                        report({
                          name: event.error ? event.error.name : 'UncaughtError',
                          message: event.message,
                          stack: event.error ? event.error.stack : undefined,
                          source: 'client',
                          route: window.location.pathname
                        });
                      }
                    } catch(e) {}
                  }, true);

                  // 2. Early unhandled promise rejections (Webpack ChunkLoadError, async crashes)
                  window.addEventListener('unhandledrejection', function(event) {
                    try {
                      var reason = event.reason;
                      var msg = typeof reason === 'string' ? reason : (reason && reason.message ? reason.message : 'Unhandled rejection');
                      if (msg.indexOf('/api/dev/errors') !== -1) return;
                      report({
                        name: reason && reason.name ? reason.name : 'UnhandledPromiseRejection',
                        message: msg,
                        stack: reason && reason.stack ? reason.stack : undefined,
                        source: 'client',
                        route: window.location.pathname
                      });
                    } catch(e) {}
                  });

                  // 3. Dev fetch interception to capture any failed internal Next.js requests (status >= 400)
                  var originalFetch = window.fetch;
                  window.fetch = function(input, init) {
                    var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
                    return originalFetch.apply(this, arguments).then(function(res) {
                      if (!res.ok && res.status >= 400 && url && url.indexOf('/api/dev/errors') === -1) {
                        report({
                          name: 'NetworkError',
                          message: 'HTTP ' + res.status + ' (' + res.statusText + ') on ' + url,
                          stack: 'Fetch failed for URL: ' + url + ' with HTTP status ' + res.status,
                          source: url.indexOf('/api/') !== -1 ? 'api' : 'build',
                          route: window.location.pathname,
                          metadata: { status: res.status, url: url }
                        });
                      }
                      return res;
                    }).catch(function(err) {
                      if (url && url.indexOf('/api/dev/errors') === -1) {
                        report({
                          name: 'FetchFailed',
                          message: 'Network request aborted/failed for ' + url + ': ' + (err ? err.message : ''),
                          stack: err ? err.stack : undefined,
                          source: 'client',
                          route: window.location.pathname,
                          metadata: { url: url }
                        });
                      }
                      throw err;
                    });
                  };
                })();
              `,
            }}
          />
        )}
      </head>
      <body className="bg-slate-50 text-slate-900 flex min-h-screen">
        <DevErrorBoundary>
          <Sidebar />
          <main className="flex-1 min-w-0 p-8 overflow-y-auto max-w-7xl mx-auto">
            {children}
          </main>
        </DevErrorBoundary>
      </body>
    </html>
  );
}
