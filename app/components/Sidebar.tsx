"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Repeat, 
  Sliders, 
  Landmark, 
  ShieldCheck,
  BookOpen
} from "lucide-react";
import { SyncButton } from "./SyncButton";

export function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: "Overblik", href: "/", icon: LayoutDashboard },
    { name: "Kontobevægelser", href: "/transactions", icon: ArrowLeftRight },
    { name: "Abonnementer", href: "/subscriptions", icon: Repeat },
    { name: "Forbindelse & Regler", href: "/settings", icon: Sliders },
    { name: "Hjælp & Guide", href: "/help", icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between h-screen sticky top-0 border-r border-slate-800 shrink-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white">Nordea Hub</h1>
              <p className="text-xs text-slate-400 font-medium">Open Banking AISP</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Sync info & Legal Links */}
      <div className="p-3 m-3 space-y-3">
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              PSD2 Aktiv (180d)
            </div>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <SyncButton />
        </div>

        <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 font-medium pt-1">
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privatliv</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-slate-300 transition-colors">Vilkår</Link>
          <span>•</span>
          <Link href="/about" className="hover:text-slate-300 transition-colors">Om & Kontakt</Link>
        </div>
      </div>
    </aside>
  );
}
