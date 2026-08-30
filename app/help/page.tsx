"use client";

import { useEffect, useState } from "react";
import { 
  BookOpen, 
  ExternalLink, 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight, 
  HelpCircle, 
  Lock, 
  Landmark, 
  Clock, 
  FileText,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  const [credStatus, setCredStatus] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  useEffect(() => {
    fetch("/api/settings/credentials")
      .then((res) => res.json())
      .then((data) => setCredStatus(data))
      .catch((e) => console.error(e));
  }, []);

  const handleCopyKey = () => {
    if (credStatus?.publicKey) {
      navigator.clipboard.writeText(credStatus.publicKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
    }
  };

  const handleCopyRedirect = () => {
    const url = credStatus?.redirectUrl || "http://localhost:3000/api/auth/callback";
    navigator.clipboard.writeText(url);
    setCopiedRedirect(true);
    setTimeout(() => setCopiedRedirect(false), 3000);
  };

  return (
    <div className="space-y-10 max-w-4xl">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Vejledning & Dokumentation</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sådan Forbinder Du Til Din Bank</h1>
        <p className="text-sm text-slate-500 mt-1">
          En trin-for-trin guide til at opsætte Enable Banking og hente live konti og posteringer fra Nordea med MitID.
        </p>
      </div>

      {/* Quick Status Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between ${
        credStatus?.isConfigured 
          ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
          : "bg-blue-50 border-blue-200 text-blue-900"
      }`}>
        <div className="flex items-center gap-3">
          {credStatus?.isConfigured ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <Key className="w-5 h-5 text-blue-600 shrink-0" />
          )}
          <div>
            <p className="font-semibold text-sm">
              {credStatus?.isConfigured
                ? "Dine API-nøgler er klar og konfigureret!"
                : "Du mangler blot at indsætte dine API-nøgler under Indstillinger."}
            </p>
            <p className="text-xs opacity-90">
              {credStatus?.isConfigured
                ? "Du kan gå direkte til Indstillinger og trykke 'Forbind med Nordea'."
                : "Følg de 5 simple trin herunder for at oprette gratis adgang."}
            </p>
          </div>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white shadow-2xs border border-slate-200 text-slate-800 hover:bg-slate-50 shrink-0"
        >
          <span>Gå til Indstillinger</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Step-by-Step Guide */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
          Trin-for-trin Opsætningsguide
        </h2>

        {/* Step 1 */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
              1
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="font-bold text-slate-900 text-base">Opret gratis konto hos Enable Banking</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Enable Banking er en autoriseret PSD2-aggregator, der giver direkte adgang til danske banker (Nordea, Danske Bank m.fl.) uden behov for egen banklicens fra Finanstilsynet.
              </p>
              <div className="pt-2">
                <a
                  href="https://enablebanking.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
                >
                  <span>Åbn Enable Banking Control Panel</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
              2
            </div>
            <div className="space-y-3 flex-1">
              <h3 className="font-bold text-slate-900 text-base">Opret en applikation og upload din offentlige nøgle</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                I Enable Banking kontrolpanelet skal du oprette en ny applikation (f.eks. med navnet <em>&quot;Mit Homebanking&quot;</em>). Her skal du uploade din offentlige RSA-nøgle.
              </p>

              {/* Public key box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Din Offentlige Nøgle (public.key)
                  </span>
                  <button
                    onClick={handleCopyKey}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md shadow-2xs transition-colors"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedKey ? "Kopieret!" : "Kopiér Nøgle"}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto max-h-28">
                  {credStatus?.publicKey || "Genererer nøgler..."}
                </pre>
              </div>

              <p className="text-xs text-slate-500">
                💡 Nøglen er allerede genereret lokalt på din maskine. Den tilhørende <code className="font-mono bg-slate-100 px-1 rounded">private.key</code> forbliver på din computer og deles aldrig.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
              3
            </div>
            <div className="space-y-3 flex-1">
              <h3 className="font-bold text-slate-900 text-base">Angiv Redirect URL</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Når du opretter applikationen, skal du angive applikationens callback/omdirigeringsadresse. Banken sender brugeren tilbage hertil efter MitID-godkendelsen.
              </p>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <code className="text-xs font-mono text-slate-800 flex-1 break-all">
                  {credStatus?.redirectUrl || "http://localhost:3000/api/auth/callback"}
                </code>
                <button
                  onClick={handleCopyRedirect}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md shadow-2xs"
                >
                  {copiedRedirect ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedRedirect ? "Kopieret" : "Kopiér"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
              4
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="font-bold text-slate-900 text-base">Kopiér Application ID og Key ID ind i appen</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Når du har gemt applikationen i Enable Banking, modtager du et <strong>Application ID</strong> (UUID format) samt et <strong>Key ID</strong> (kid) for din uploadede nøgle.
              </p>
              <p className="text-sm text-slate-600">
                Gå til <Link href="/settings" className="text-blue-600 font-semibold hover:underline">Forbindelse & Indstillinger</Link>, indsæt de to værdier i formularen og tryk på <strong>Gem API Nøgler</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
              5
            </div>
            <div className="space-y-3 flex-1">
              <h3 className="font-bold text-slate-900 text-base">Forbind med Nordea via MitID</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tryk på <strong>&quot;Forbind med Nordea (MitID)&quot;</strong>. Du omdirigeres direkte til Nordeas officielle PSD2 godkendelsesside:
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
                <li>Log ind med dit <strong>MitID</strong>.</li>
                <li>Vælg hvilke konti (f.eks. Lønkonto, Budgetkonto, Opsparing) du vil give læseadgang til.</li>
                <li>Bekræft godkendelsen.</li>
              </ul>
              <p className="text-xs text-slate-500">
                Efter godkendelse ledes du automatisk tilbage til applikationen, og dine reelle konti og kontobevægelser hentes og klassificeres med det samme!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions (FAQ) */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <span>Ofte Stillede Spørgsmål (FAQ)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Lock className="w-4 h-4 text-emerald-600" />
              <h4>Er mine bankdata og login sikre?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ja, 100%. Applikationen ser eller gemmer <strong>aldrig</strong> dine koder eller MitID-oplysninger. Du logger altid ind på Nordeas egen godkendelsesside. Alle data gemmes lokalt i en SQLite-database på din computer uden eksterne cloud-servere.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Clock className="w-4 h-4 text-purple-600" />
              <h4>Hvorfor skal jeg godkende igen efter 180 dage?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              EU&apos;s PSD2-direktiv og Finanstilsynet fastsætter, at et digitalt samtykke til kontolæseadgang (AISP) maksimalt må være gyldigt i 180 dage. Herefter skal du blot trykke &quot;Forny Samtykke&quot; og swipe én gang i MitID.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Landmark className="w-4 h-4 text-blue-600" />
              <h4>Kan jeg forbinde andre banker end Nordea?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ja! Enable Banking understøtter alle større danske banker (f.eks. Danske Bank, Jyske Bank, Nykredit, Sydbank, Arbejdernes Landsbank). Systemets arkitektur er forberedt på flervaluta og flere samtidige bankforbindelser.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FileText className="w-4 h-4 text-amber-600" />
              <h4>Koster Enable Banking noget for privatpersoner?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enable Banking tilbyder en transparent udvikleradgang med fri kvote til personlige projekter og betaling per synkronisering (pay-as-you-go) uden faste enterprise månedsaftaler.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
