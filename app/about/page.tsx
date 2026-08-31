import { Info, Landmark, ShieldCheck, Mail, Github, Code, Server, Heart, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-4xl space-y-8 pb-16">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Tilbage til Indstillinger</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Om Homebanking & Kontakt</h1>
            <p className="text-xs text-slate-500">
              Open Banking AISP Kontrolcenter & Personlig Økonomistyring
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Landmark className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Nordea PSD2 Live</h3>
            <p className="text-xs text-slate-500">Direkte integration med Nordea Danmark via reguleret Open Banking.</p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 mt-3 block">✓ AISP Certificeret</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Lokal Privatlivs-Arkitektur</h3>
            <p className="text-xs text-slate-500">Dine bankdata gemmes kun i din lokale SQLite database på egen maskine.</p>
          </div>
          <span className="text-[11px] font-semibold text-purple-600 mt-3 block">✓ 100% On-Device Data</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">MitID Sikkerhed</h3>
            <p className="text-xs text-slate-500">SCA (Strong Customer Authentication) foretages direkte hos banken.</p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 mt-3 block">✓ Ingen kode-logging</span>
        </div>
      </div>

      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 text-slate-700 text-sm leading-relaxed">
        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900">Teknisk Arkitektur</h3>
          <p>
            Homebanking er bygget med Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma ORM og SQLite.
            Kommunikationen med Open Banking netværket sker via Enable Banking API med asymmetrisk RSA-2048 RS256 nøglesignering.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Juridiske Dokumenter</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/privacy"
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors group block"
            >
              <h4 className="font-semibold text-slate-900 text-xs uppercase mb-1 group-hover:text-blue-600">
                Privatlivspolitik (GDPR) →
              </h4>
              <p className="text-xs text-slate-500">Læs hvordan dine bankdata behandles, opbevares og slettes.</p>
            </Link>

            <Link
              href="/terms"
              className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 transition-colors group block"
            >
              <h4 className="font-semibold text-slate-900 text-xs uppercase mb-1 group-hover:text-purple-600">
                Brugervilkår (Terms) →
              </h4>
              <p className="text-xs text-slate-500">Gennemse vilkår for AISP læseadgang og 180 dages samtykke.</p>
            </Link>
          </div>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Kontakt & Udvikler</h3>
          <p className="text-xs text-slate-600">
            Dette projekt vedligeholdes på GitHub. For support, tekniske spørgsmål eller bidrag til koden:
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="https://github.com/Razsk/homebanking"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub Repository (Razsk/homebanking)</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
