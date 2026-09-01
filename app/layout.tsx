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
                  window.addEventListener('error', function(event) {
                    try {
                      var target = event.target || event.srcElement;
                      var isResource = target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK' || target.tagName === 'IMG');
                      if (isResource) {
                        var src = target.src || target.href || '';
                        if (!src) return;
                        fetch('/api/dev/errors', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: 'ResourceLoadError',
                            message: 'Failed to load resource: ' + src + ' (Status 500)',
                            stack: 'Resource load failed on <' + target.tagName.toLowerCase() + '> at ' + src,
                            source: 'build',
                            route: window.location.pathname,
                            metadata: { resourceUrl: src, tagName: target.tagName }
                          })
                        }).catch(function() {});
                      }
                    } catch(e) {}
                  }, true);
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
