import { FileText, ShieldAlert, CheckCircle2, ArrowLeft, Scale, Lock, Landmark } from "lucide-react";
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
