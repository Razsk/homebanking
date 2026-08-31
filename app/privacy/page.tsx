import { Shield, FileCheck, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
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
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Privatlivspolitik & Databeskyttelse</h1>
            <p className="text-xs text-slate-500">
              Gældende for Homebanking (Open Banking AISP Integration) • Sidst opdateret: August 2026
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100 shadow-sm">
        <h2 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          Kort overblik over dine data og rettigheder
        </h2>
        <ul className="space-y-2 text-xs text-slate-700">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Lokal Datalagring:</strong> Dine bankkonti og transaktionshistorik lagres udelukkende lokalt i din egen database (SQLite) på dit eget system.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Ingen videresalg eller deling:</strong> Dine finansielle oplysninger sendes eller sælges <em>aldrig</em> til reklamebureauer, analysefirmaer eller andre tredjeparter.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Kun Læseadgang (AISP):</strong> Applikationen har udelukkende læseadgang. Den kan <em>ikke</em> udføre betalinger, overførsler eller ændre dine konti.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Fuld Sletteret:</strong> Du kan til enhver tid slette samtlige transaktioner eller tilbagekalde dit samtykke med ét klik.
            </span>
          </li>
        </ul>
      </div>

      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-8 text-slate-700 text-sm leading-relaxed">
        
        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">1</span>
            Dataansvarlig og Tjenestens Formål
          </h3>
          <p>
            Homebanking er en personlig økonomistyringsapplikation, der giver brugeren et samlet visuelt overblik over kontosaldi, transaktionshistorik, udgiftskategorier og faste abonnementer.
          </p>
          <p>
            Dataforbindelsen etableres direkte mellem brugerens bank (f.eks. Nordea Danmark) og applikationen via Enable Banking API (PSD2 Account Information Service Provider).
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">2</span>
            Hvilke Data Indsamles og Behandles?
          </h3>
          <p>
            Gennem PSD2 Open Banking API&apos;et indhentes udelukkende de data, som du eksplicit godkender via dit MitID samtykke:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-semibold text-slate-900 text-xs uppercase mb-1">Kontooplysninger</h4>
              <p className="text-xs text-slate-600">Kontonavn, IBAN / kontonummer, valuta og aktuel/disponibel saldo.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-semibold text-slate-900 text-xs uppercase mb-1">Transaktionsdata</h4>
              <p className="text-xs text-slate-600">Bogføringsdato, beløb, valuta, modpartsnavn og posteringstekst.</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <strong>Vigtigt:</strong> Applikationen har <em>aldrig</em> adgang til dit MitID, CPR-nummer, personlige bankkoder eller loginoplysninger. Godkendelsen sker direkte i bankens eget krypterede vindue.
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">3</span>
            Formål med Behandlingen (GDPR Art. 6)
          </h3>
          <p>
            Behandlingen af dine bankdata sker udelukkende på baggrund af dit udtrykkelige samtykke (GDPR artikel 6, stk. 1, litra a) med følgende specifikke formål:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 pl-2">
            <li>Beregning og visualisering af månedligt cash flow og nettoformue.</li>
            <li>Automatisk kategorisering af udgifter (f.eks. Bolig, Dagligvarer, Transport, Fornøjelser).</li>
            <li>Automatisk identifikation af tilbagevendende abonnementer og faste betalinger.</li>
            <li>Eksport af egne posteringer til CSV / Excel og JSON backup.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">4</span>
            Tredjepart & Enable Banking Teknisk Mellemmand
          </h3>
          <p>
            For at forbinde sikkert til Nordeas PSD2 API anvendes <strong>Enable Banking Oy</strong> (Finland, org.nr. 2977464-9) som autoriseret teknisk gateway. Enable Banking er reguleret som Account Information Service Provider (AISP) af det finske Finanstilsyn (Finanssivalvonta).
          </p>
          <p>
            Enable Banking fungerer som en datatransporterende gateway (pass-through). Al kommunikation mellem applikationen og Enable Banking er krypteret med asymmetrisk RS256 JWT og TLS 1.3.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">5</span>
            Samtykkets Varighed & 180-Dages Reglen
          </h3>
          <p>
            I henhold til EU PSD2 (Direktiv 2015/2366) og EBA Regulatory Technical Standards er et bank-samtykke gyldigt i <strong>højst 180 dage</strong>.
          </p>
          <p>
            Efter 180 dage udløber adgangen automatisk, medmindre du aktivt fornyer samtykket med en ny MitID-godkendelse. Du kan når som helst tilbagekalde samtykket før tid i din netbank eller under Indstillinger.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">6</span>
            Dine Rettigheder (GDPR Art. 15-22)
          </h3>
          <p>Under GDPR har du en række ukrænkelige rettigheder over dine data:</p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 pl-2">
            <li><strong>Ret til indsigt:</strong> Du kan se og eksportere samtlige data under Indstillinger &gt; Eksport & Data.</li>
            <li><strong>Ret til sletning (Retten til at blive glemt):</strong> Du kan slette alle transaktioner eller foretage fuld fabriksnulstilling via appens kontrolpanel.</li>
            <li><strong>Ret til dataportabilitet:</strong> Du kan hente alle data som standardiseret CSV eller JSON.</li>
            <li><strong>Ret til tilbagekaldelse:</strong> Du kan til enhver tid stoppe fremtidig datahentning.</li>
          </ul>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">7</span>
            Kontakt vedrørende Databeskyttelse
          </h3>
          <p className="text-xs text-slate-600">
            Har du spørgsmål til databeskyttelse, eller ønsker du vejledning om tilbagekaldelse af samtykker, kan du kontakte os på <Link href="/about" className="text-blue-600 font-semibold hover:underline">Om & Kontakt-siden</Link> eller direkte via vores GitHub repository.
          </p>
        </section>

      </div>
    </div>
  );
}
