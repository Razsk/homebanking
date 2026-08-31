import os

os.makedirs('app/privacy', exist_ok=True)
os.makedirs('app/terms', exist_ok=True)
os.makedirs('app/about', exist_ok=True)

privacy_content = '''import { Shield, FileCheck, CheckCircle2, ArrowLeft } from "lucide-react";
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
'''

terms_content = '''import { FileText, ShieldAlert, CheckCircle2, ArrowLeft, Scale, Lock, Landmark } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
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
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Brugervilkår & Betingelser</h1>
            <p className="text-xs text-slate-500">
              Vilkår for anvendelse af Homebanking Applikationen • Sidst opdateret: August 2026
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100 shadow-sm space-y-2">
        <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Scale className="w-5 h-5 text-purple-600" />
          Vilkår i korte træk
        </h2>
        <p className="text-xs text-slate-700 leading-relaxed">
          Ved at benytte denne applikation og tilslutte dine bankkonti via Open Banking accepterer du nærværende vilkår.
          Applikationen fungerer udelukkende som et personligt finansielt analyse- og overbliksværktøj og yder ikke autoriseret finansiel eller skattemæssig rådgivning.
        </p>
      </div>

      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-8 text-slate-700 text-sm leading-relaxed">
        
        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">1</span>
            Tjenestens Karakter og Afgrænsning
          </h3>
          <p>
            Homebanking er en open-source / personlig applikation, der stiller kontooversigter, grafiske analyser, udgiftsfordelinger og abonnementssporing til rådighed.
          </p>
          <p>
            Tjenesten anvender PSD2 Account Information Services (AISP) til at læse historiske og aktuelle kontobevægelser fra brugerens bank.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">2</span>
            Udelukkende Læseadgang (Ingen Betalingsinitiering)
          </h3>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="text-slate-900">Ingen overførsels- eller betalingsfunktionalitet (PISP):</strong>
              <p className="text-slate-600">
                Applikationen er teknisk afgrænset til kun at forespørge saldi og transaktioner. Det er umuligt for applikationen at igangsætte overførsler, betale regninger eller hæve penge fra dine konti.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">3</span>
            Brugerens Ansvar og Sikkerhed
          </h3>
          <p>Som bruger forpligter du dig til:</p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 pl-2">
            <li>Kun at tilknytte bankkonti, som du selv ejer eller har lovlig dispositionsret over.</li>
            <li>At holde dine lokale API-nøgler (`private.key` og `.env`) fortrolige og sikre på dit eget system.</li>
            <li>Ikke at forsøge at manipulere med data eller omgå bankernes godkendelsesmekanismer (SCA).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">4</span>
            Samtykke og Bankforbindelse (180 Dage)
          </h3>
          <p>
            Ved tilslutning omdirigeres du til bankens egen MitID-side. Et tildelt samtykke er gyldigt i op til 180 dage jf. gældende EU PSD2-lovgivning. Du kan til enhver tid trække dit samtykke tilbage via din egen netbank eller under Indstillinger i denne app.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">5</span>
            Ansvarsfraskrivelse (Disclaimer)
          </h3>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              Ikke finansiel rådgivning:
            </p>
            <p className="text-amber-800 leading-relaxed">
              Alle beregninger, grafer, udgiftsfordelinger og abonnementsopgørelser er vejledende visualiseringer. Homebanking og udviklerne bag påtager sig intet ansvar for økonomiske beslutninger, skatteindberetninger eller eventuelle datauoverensstemmelser forårsaget af bankens PSD2 API-leverance.
            </p>
          </div>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">6</span>
            Kontakt & Spørgsmål
          </h3>
          <p className="text-xs text-slate-600">
            For spørgsmål til disse vilkår, se vores <Link href="/about" className="text-blue-600 font-semibold hover:underline">Om & Kontakt-side</Link>.
          </p>
        </section>

      </div>
    </div>
  );
}
'''

about_content = '''import { Info, Landmark, ShieldCheck, Mail, Github, Code, Server, Heart, ArrowLeft, ExternalLink } from "lucide-react";
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
'''

with open('app/privacy/page.tsx', 'w', encoding='utf-8') as f:
    f.write(privacy_content)

with open('app/terms/page.tsx', 'w', encoding='utf-8') as f:
    f.write(terms_content)

with open('app/about/page.tsx', 'w', encoding='utf-8') as f:
    f.write(about_content)

print('Successfully generated /privacy, /terms, and /about pages!')

