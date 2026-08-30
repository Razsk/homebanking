import "./globals.css";
import { Sidebar } from "./components/Sidebar";

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
      <body className="bg-slate-50 text-slate-900 flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 p-8 overflow-y-auto max-w-7xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
