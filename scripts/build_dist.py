#!/usr/bin/env python3
import os
import shutil
import subprocess

def build_dist():
    print("=== 1. Building Next.js application (npm run build) ===")
    subprocess.run(["npm", "run", "build"], check=True, shell=True)

    dist_dir = os.path.abspath("dist")
    if os.path.exists(dist_dir):
        shutil.rmtree(dist_dir)
    os.makedirs(dist_dir, exist_ok=True)

    print("=== 2. Copying static assets to ./dist ===")
    next_static = os.path.abspath(".next/static")
    dist_next_static = os.path.join(dist_dir, "_next", "static")
    if os.path.exists(next_static):
        os.makedirs(os.path.dirname(dist_next_static), exist_ok=True)
        shutil.copytree(next_static, dist_next_static)
        print(f"Copied .next/static -> {dist_next_static}")

    public_dir = os.path.abspath("public")
    if os.path.exists(public_dir):
        for item in os.listdir(public_dir):
            if item == "screenshots":
                continue
            s = os.path.join(public_dir, item)
            d = os.path.join(dist_dir, item)
            if os.path.isdir(s):
                shutil.copytree(s, d)
            else:
                shutil.copy2(s, d)
        print(f"Copied public assets (excluding screenshots) -> {dist_dir}")

    print("=== 3. Generating rich standalone static compliance pages ===")

    html_head = '''<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    code, pre { font-family: 'JetBrains Mono', monospace; }
  </style>
'''

    header_bar = '''
  <!-- Top Navigation Header -->
  <header class="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
    <div class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
      <a href="/" class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
        </div>
        <div>
          <span class="font-bold text-white text-base leading-none">Homebanking</span>
          <span class="block text-[10px] text-blue-400 font-semibold tracking-wider uppercase mt-0.5">Open Banking AISP</span>
        </div>
      </a>
      <nav class="flex items-center gap-1 sm:gap-2 text-xs font-semibold text-slate-300">
        <a href="/privacy" class="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors">Privatliv</a>
        <a href="/terms" class="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors">Vilkår</a>
        <a href="/help" class="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors">Hjælp</a>
        <a href="/about" class="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors">Om</a>
      </nav>
    </div>
  </header>
'''

    footer_bar = '''
  <!-- Footer -->
  <footer class="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 mt-20">
    <div class="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Homebanking • Reguleret PSD2 Account Information Service</span>
      </div>
      <div class="flex items-center gap-4 font-medium">
        <a href="/privacy" class="hover:text-blue-600 transition-colors">Privatlivspolitik</a>
        <span>•</span>
        <a href="/terms" class="hover:text-purple-600 transition-colors">Brugervilkår</a>
        <span>•</span>
        <a href="/help" class="hover:text-emerald-600 transition-colors">Hjælp & Guide</a>
        <span>•</span>
        <a href="/about" class="hover:text-amber-600 transition-colors">Om & Kontakt</a>
        <span>•</span>
        <a href="https://github.com/Razsk/homebanking" target="_blank" class="hover:text-slate-900 transition-colors">GitHub</a>
      </div>
    </div>
  </footer>
'''

    # 1. Privacy Page HTML
    privacy_html = f'''{html_head}
  <title>Privatlivspolitik & Databeskyttelse | Homebanking AISP</title>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col justify-between">
  {header_bar}
  <main class="max-w-4xl mx-auto px-6 py-12 w-full space-y-8">
    <div>
      <a href="/" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3">
        ← Tilbage til Forsiden
      </a>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shadow-xs">
          🔒
        </div>
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Privatlivspolitik & Databeskyttelse</h1>
          <p class="text-xs text-slate-500">Gældende for Homebanking (Open Banking AISP Integration) • Sidst opdateret: August 2026</p>
        </div>
      </div>
    </div>

    <!-- Summary Box -->
    <div class="p-6 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100 shadow-sm">
      <h2 class="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
        <span class="text-blue-600">✓</span> Kort overblik over dine data og rettigheder
      </h2>
      <ul class="space-y-2.5 text-xs sm:text-sm text-slate-700">
        <li class="flex items-start gap-2.5">
          <span class="text-emerald-600 font-bold mt-0.5">✓</span>
          <span><strong>Lokal Datalagring:</strong> Dine bankkonti og transaktionshistorik lagres udelukkende lokalt i din egen database (SQLite) på dit eget system.</span>
        </li>
        <li class="flex items-start gap-2.5">
          <span class="text-emerald-600 font-bold mt-0.5">✓</span>
          <span><strong>Ingen videresalg eller deling:</strong> Dine finansielle oplysninger sendes eller sælges <em>aldrig</em> til reklamebureauer, analysefirmaer eller andre tredjeparter.</span>
        </li>
        <li class="flex items-start gap-2.5">
          <span class="text-emerald-600 font-bold mt-0.5">✓</span>
          <span><strong>Kun Læseadgang (AISP):</strong> Applikationen har udelukkende læseadgang. Den kan <em>ikke</em> udføre betalinger, overførsler eller ændre dine konti.</span>
        </li>
        <li class="flex items-start gap-2.5">
          <span class="text-emerald-600 font-bold mt-0.5">✓</span>
          <span><strong>Fuld Sletteret:</strong> Du kan til enhver tid slette samtlige transaktioner eller tilbagekalde dit samtykke med ét klik.</span>
        </li>
      </ul>
    </div>

    <!-- Main Content -->
    <div class="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-8 text-slate-700 text-sm leading-relaxed">
      <section class="space-y-3">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">1</span>
          Dataansvarlig og Tjenestens Formål
        </h3>
        <p>Homebanking er en personlig økonomistyringsapplikation, der giver brugeren et samlet visuelt overblik over kontosaldi, transaktionshistorik, udgiftskategorier og faste abonnementer.</p>
        <p>Dataforbindelsen etableres direkte mellem brugerens bank (f.eks. Nordea Danmark) og applikationen via Enable Banking API (PSD2 Account Information Service Provider).</p>
      </section>

      <section class="space-y-3">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">2</span>
          Hvilke Data Indsamles og Behandles?
        </h3>
        <p>Gennem PSD2 Open Banking API'et indhentes udelukkende de data, som du eksplicit godkender via dit MitID samtykke:</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 class="font-semibold text-slate-900 text-xs uppercase mb-1">Kontooplysninger</h4>
            <p class="text-xs text-slate-600">Kontonavn, IBAN / kontonummer, valuta og aktuel/disponibel saldo.</p>
          </div>
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 class="font-semibold text-slate-900 text-xs uppercase mb-1">Transaktionsdata</h4>
            <p class="text-xs text-slate-600">Bogføringsdato, beløb, valuta, modpartsnavn og posteringstekst.</p>
          </div>
        </div>
        <div class="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <strong>Vigtigt:</strong> Applikationen har <em>aldrig</em> adgang til dit MitID, CPR-nummer, personlige bankkoder eller loginoplysninger. Godkendelsen sker direkte i bankens eget krypterede vindue.
        </div>
      </section>

      <section class="space-y-3">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">3</span>
          Formål med Behandlingen (GDPR Art. 6)
        </h3>
        <p>Behandlingen af dine bankdata sker udelukkende på baggrund af dit udtrykkelige samtykke (GDPR artikel 6, stk. 1, litra a) med følgende formål:</p>
        <ul class="list-disc list-inside space-y-1.5 text-xs text-slate-600 pl-2">
          <li>Beregning og visualisering af månedligt cash flow og nettoformue.</li>
          <li>Automatisk kategorisering af udgifter (f.eks. Bolig, Dagligvarer, Transport, Fornøjelser).</li>
          <li>Automatisk identifikation af tilbagevendende abonnementer og faste betalinger.</li>
          <li>Eksport af egne posteringer til CSV / Excel og JSON backup.</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">4</span>
          Tredjepart & Enable Banking Teknisk Mellemmand
        </h3>
        <p>For at forbinde sikkert til Nordeas PSD2 API anvendes <strong>Enable Banking Oy</strong> (Finland, org.nr. 2977464-9) som autoriseret teknisk gateway. Enable Banking er reguleret som Account Information Service Provider (AISP) af det finske Finanstilsyn (Finanssivalvonta).</p>
        <p>Al kommunikation mellem applikationen og Enable Banking er krypteret med asymmetrisk RS256 JWT og TLS 1.3.</p>
      </section>

      <section class="space-y-3">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">5</span>
          Samtykkets Varighed & 180-Dages Reglen
        </h3>
        <p>I henhold til EU PSD2 (Direktiv 2015/2366) og EBA Regulatory Technical Standards er et bank-samtykke gyldigt i <strong>højst 180 dage</strong>.</p>
        <p>Efter 180 dage udløber adgangen automatisk, medmindre du aktivt fornyer samtykket med en ny MitID-godkendelse. Du kan når som helst tilbagekalde samtykket før tid i din netbank.</p>
      </section>

      <section class="space-y-3">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">6</span>
          Dine Rettigheder (GDPR Art. 15-22)
        </h3>
        <ul class="list-disc list-inside space-y-1.5 text-xs text-slate-600 pl-2">
          <li><strong>Ret til indsigt:</strong> Du kan se og eksportere samtlige data under Indstillinger &gt; Eksport & Data.</li>
          <li><strong>Ret til sletning (Retten til at blive glemt):</strong> Du kan slette alle transaktioner eller foretage fuld fabriksnulstilling via appens kontrolpanel.</li>
          <li><strong>Ret til dataportabilitet:</strong> Du kan hente alle data som standardiseret CSV eller JSON.</li>
          <li><strong>Ret til tilbagekaldelse:</strong> Du kan til enhver tid stoppe fremtidig datahentning.</li>
        </ul>
      </section>

      <section class="space-y-3 pt-4 border-t border-slate-100">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">7</span>
          Kontakt vedrørende Databeskyttelse
        </h3>
        <p class="text-xs text-slate-600">Har du spørgsmål til databeskyttelse, kan du kontakte os på <a href="/about" class="text-blue-600 font-semibold hover:underline">Om & Kontakt-siden</a> eller via vores GitHub repository.</p>
      </section>
    </div>
  </main>
  {footer_bar}
</body>
</html>'''

    # 2. Terms Page HTML
    terms_html = f'''{html_head}
  <title>Brugervilkår & Betingelser | Homebanking AISP</title>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col justify-between">
  {header_bar}
  <main class="max-w-4xl mx-auto px-6 py-12 w-full space-y-8">
    <div>
      <a href="/" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3">
        ← Tilbage til Forsiden
      </a>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl shadow-xs">
          📜
        </div>
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Brugervilkår & Betingelser</h1>
          <p class="text-xs text-slate-500">Vilkår for anvendelse af Homebanking Applikationen • Sidst opdateret: August 2026</p>
        </div>
      </div>
    </div>

    <div class="p-6 bg-purple-50/50 rounded-2xl border border-purple-100 shadow-sm space-y-2">
      <h2 class="font-bold text-slate-900 text-base flex items-center gap-2">
        <span class="text-purple-600">⚖️</span> Vilkår i korte træk
      </h2>
      <p class="text-xs sm:text-sm text-slate-700 leading-relaxed">
        Ved at benytte denne applikation og tilslutte dine bankkonti via Open Banking accepterer du nærværende vilkår.
        Applikationen fungerer udelukkende som et personligt finansielt analyse- og overbliksværktøj og yder ikke autoriseret finansiel eller skattemæssig rådgivning.
      </p>
    </div>

    <div class="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-8 text-slate-700 text-sm leading-relaxed">
      <section class="space-y-3">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">1</span>
          Tjenestens Karakter og Afgrænsning
        </h3>
        <p>Homebanking er en personlig applikation, der stiller kontooversigter, grafiske analyser, udgiftsfordelinger og abonnementssporing til rådighed.</p>
        <p>Tjenesten anvender PSD2 Account Information Services (AISP) til at læse historiske og aktuelle kontobevægelser fra brugerens bank.</p>
      </section>

      <section class="space-y-3">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">2</span>
          Udelukkende Læseadgang (Ingen Betalingsinitiering)
        </h3>
        <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <strong class="text-slate-900">Ingen overførsels- eller betalingsfunktionalitet (PISP):</strong>
          <p class="text-slate-600">Applikationen er teknisk afgrænset til kun at forespørge saldi og transaktioner. Det er umuligt for applikationen at igangsætte overførsler, betale regninger eller hæve penge fra dine konti.</p>
        </div>
      </section>

      <section class="space-y-3">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">3</span>
          Brugerens Ansvar og Sikkerhed
        </h3>
        <ul class="list-disc list-inside space-y-1.5 text-xs text-slate-600 pl-2">
          <li>Kun at tilknytte bankkonti, som du selv ejer eller har lovlig dispositionsret over.</li>
          <li>At holde dine lokale API-nøgler fortrolige og sikre på dit eget system.</li>
          <li>Ikke at forsøge at manipulere med data eller omgå bankernes godkendelsesmekanismer (SCA).</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">4</span>
          Samtykke og Bankforbindelse (180 Dage)
        </h3>
        <p>Ved tilslutning omdirigeres du til bankens egen MitID-side. Et tildelt samtykke er gyldigt i op til 180 dage jf. gældende EU PSD2-lovgivning. Du kan til enhver tid trække dit samtykke tilbage via din egen netbank.</p>
      </section>

      <section class="space-y-3">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <span class="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono">5</span>
          Ansvarsfraskrivelse (Disclaimer)
        </h3>
        <div class="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1.5">
          <p class="font-semibold">⚠️ Ikke finansiel rådgivning:</p>
          <p class="text-amber-800 leading-relaxed">Alle beregninger, grafer, udgiftsfordelinger og abonnementsopgørelser er vejledende visualiseringer. Homebanking påtager sig intet ansvar for økonomiske beslutninger eller skatteindberetninger.</p>
        </div>
      </section>
    </div>
  </main>
  {footer_bar}
</body>
</html>'''

    # 3. About Page HTML
    about_html = f'''{html_head}
  <title>Om Homebanking & Kontakt | Open Banking AISP</title>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col justify-between">
  {header_bar}
  <main class="max-w-4xl mx-auto px-6 py-12 w-full space-y-8">
    <div>
      <a href="/" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3">
        ← Tilbage til Forsiden
      </a>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shadow-xs">
          ℹ️
        </div>
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Om Homebanking & Kontakt</h1>
          <p class="text-xs text-slate-500">Open Banking AISP Kontrolcenter & Personlig Økonomistyring</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 font-bold">🏛️</div>
          <h3 class="font-bold text-slate-900 text-sm mb-1">Nordea PSD2 Live</h3>
          <p class="text-xs text-slate-500">Direkte integration med Nordea Danmark via reguleret Open Banking.</p>
        </div>
        <span class="text-[11px] font-semibold text-emerald-600 mt-3 block">✓ AISP Certificeret</span>
      </div>

      <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3 font-bold">🔒</div>
          <h3 class="font-bold text-slate-900 text-sm mb-1">Lokal Privatlivs-Arkitektur</h3>
          <p class="text-xs text-slate-500">Dine bankdata gemmes kun i din lokale SQLite database på egen maskine.</p>
        </div>
        <span class="text-[11px] font-semibold text-purple-600 mt-3 block">✓ 100% On-Device Data</span>
      </div>

      <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 font-bold">🛡️</div>
          <h3 class="font-bold text-slate-900 text-sm mb-1">MitID Sikkerhed</h3>
          <p class="text-xs text-slate-500">SCA (Strong Customer Authentication) foretages direkte hos banken.</p>
        </div>
        <span class="text-[11px] font-semibold text-emerald-600 mt-3 block">✓ Ingen kode-logging</span>
      </div>
    </div>

    <div class="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 text-slate-700 text-sm leading-relaxed">
      <section class="space-y-3">
        <h3 class="text-base font-bold text-slate-900">Teknisk Arkitektur</h3>
        <p>Homebanking er bygget med Next.js 14, TypeScript, Tailwind CSS, Prisma ORM og SQLite. Kommunikationen med Open Banking netværket sker via Enable Banking API med asymmetrisk RSA-2048 RS256 nøglesignering.</p>
      </section>

      <section class="space-y-3 pt-4 border-t border-slate-100">
        <h3 class="text-base font-bold text-slate-900">Juridiske Dokumenter</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="/privacy" class="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors group block">
            <h4 class="font-semibold text-slate-900 text-xs uppercase mb-1 group-hover:text-blue-600">Privatlivspolitik (GDPR) →</h4>
            <p class="text-xs text-slate-500">Læs hvordan dine bankdata behandles, opbevares og slettes.</p>
          </a>
          <a href="/terms" class="p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 transition-colors group block">
            <h4 class="font-semibold text-slate-900 text-xs uppercase mb-1 group-hover:text-purple-600">Brugervilkår (Terms) →</h4>
            <p class="text-xs text-slate-500">Gennemse vilkår for AISP læseadgang og 180 dages samtykke.</p>
          </a>
        </div>
      </section>

      <section class="space-y-3 pt-4 border-t border-slate-100">
        <h3 class="text-base font-bold text-slate-900">Kontakt & Udvikler</h3>
        <p class="text-xs text-slate-600">Dette projekt vedligeholdes på GitHub. For support, tekniske spørgsmål eller bidrag til koden:</p>
        <div class="pt-1">
          <a href="https://github.com/Razsk/homebanking" target="_blank" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm">
            <span>GitHub Repository (Razsk/homebanking) →</span>
          </a>
        </div>
      </section>
    </div>
  </main>
  {footer_bar}
</body>
</html>'''

    # 4. Help Page HTML
    help_html = f'''{html_head}
  <title>Hjælp & Guide | Sådan Forbinder Du Til Din Bank</title>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col justify-between">
  {header_bar}
  <main class="max-w-4xl mx-auto px-6 py-12 w-full space-y-8">
    <div>
      <a href="/" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3">
        ← Tilbage til Forsiden
      </a>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl shadow-xs">
          🧭
        </div>
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Hjælp & Guide: Forbind Din Bank</h1>
          <p class="text-xs text-slate-500">Trin-for-trin guide til at opsætte Enable Banking og hente live konti fra Nordea med MitID.</p>
        </div>
      </div>
    </div>

    <!-- Steps -->
    <div class="space-y-4">
      <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
        <div class="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">1</div>
        <div class="space-y-1 flex-1">
          <h3 class="font-bold text-slate-900 text-base">Opret en gratis udviklerkonto hos Enable Banking</h3>
          <p class="text-xs text-slate-600">Gå til <a href="https://enablebanking.com" target="_blank" class="text-blue-600 font-semibold hover:underline">enablebanking.com</a> og opret din konto.</p>
        </div>
      </div>

      <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
        <div class="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">2</div>
        <div class="space-y-2 flex-1">
          <h3 class="font-bold text-slate-900 text-base">Opret din applikation i Enable Banking Control Panel</h3>
          <p class="text-xs text-slate-600">Opret en ny app (f.eks. &quot;Homebanking&quot;) og upload din offentlige RSA nøgle (<code class="bg-slate-100 px-1 py-0.5 rounded font-mono">public.key</code>).</p>
        </div>
      </div>

      <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
        <div class="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">3</div>
        <div class="space-y-3 flex-1">
          <h3 class="font-bold text-slate-900 text-base">Angiv Redirect URL og Offentlige Krav (Privacy & Terms)</h3>
          <p class="text-xs text-slate-600">Indtast dine godkendte offentlige adresser i Enable Banking kontrolpanelet:</p>
          <div class="space-y-2">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Redirect URL (Auth Callback)</span>
              <code class="text-xs font-mono text-slate-800">http://localhost:3000/api/auth/callback</code>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Privacy Policy URL</span>
                <a href="/privacy" class="text-xs font-mono text-blue-600 hover:underline">/privacy →</a>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Terms of Service URL</span>
                <a href="/terms" class="text-xs font-mono text-purple-600 hover:underline">/terms →</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
        <div class="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">4</div>
        <div class="space-y-1 flex-1">
          <h3 class="font-bold text-slate-900 text-base">Indsæt Application ID og Key ID i applikationen</h3>
          <p class="text-xs text-slate-600">Kopiér Application ID og Key ID ind under Indstillinger og gem dine API nøgler.</p>
        </div>
      </div>

      <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
        <div class="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">5</div>
        <div class="space-y-1 flex-1">
          <h3 class="font-bold text-slate-900 text-base">Forbind med Nordea via MitID</h3>
          <p class="text-xs text-slate-600">Tryk på &quot;Forbind med Nordea (MitID)&quot;, godkend i bankens sikre SCA-vindue, og dine data hentes automatisk!</p>
        </div>
      </div>
    </div>
  </main>
  {footer_bar}
</body>
</html>'''

    pages = {
        'privacy': privacy_html,
        'terms': terms_html,
        'about': about_html,
        'help': help_html,
    }

    for name, content in pages.items():
        page_dir = os.path.join(dist_dir, name)
        os.makedirs(page_dir, exist_ok=True)
        with open(os.path.join(page_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write(content)
        with open(os.path.join(dist_dir, f"{name}.html"), "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Generated ./dist/{name}/index.html and ./dist/{name}.html ({len(content)} bytes)")

    # 5. Index Portal Landing Page HTML
    index_html = f'''<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Homebanking — Open Banking AISP Portal</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Plus Jakarta Sans', sans-serif; }}
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between">
  <div class="max-w-4xl mx-auto px-6 py-16 w-full space-y-12">
    
    <!-- Brand Header -->
    <div class="flex items-center gap-4">
      <div class="inline-flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div class="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
        </div>
        <div>
          <h1 class="text-xl font-extrabold text-white tracking-tight">Homebanking</h1>
          <p class="text-xs text-blue-400 font-semibold uppercase tracking-wider">Open Banking AISP Portal</p>
        </div>
      </div>
    </div>

    <!-- Hero -->
    <div class="space-y-4">
      <h2 class="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
        Offentlige Compliance- &<br><span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Juridiske Informationssider</span>
      </h2>
      <p class="text-slate-400 text-base max-w-2xl leading-relaxed">
        Velkommen til Homebanking integrationsportalen. Nedenfor finder du de officielle juridiske dokumenter, privatlivspolitik, brugervilkår og onboarding-vejledning til Enable Banking API godkendelsen.
      </p>
    </div>

    <!-- Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <a href="/privacy" class="p-6 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl transition-all group flex flex-col justify-between">
        <div class="space-y-2">
          <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg mb-3">
            🔒
          </div>
          <h3 class="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Privatlivspolitik (GDPR)</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Dokumentation for lokal SQLite opbevaring, dataminimering, formålsbegrænsning og fuld sletteret.
          </p>
        </div>
        <span class="text-xs font-semibold text-blue-400 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          Læs Privatlivspolitik →
        </span>
      </a>

      <a href="/terms" class="p-6 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl transition-all group flex flex-col justify-between">
        <div class="space-y-2">
          <div class="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg mb-3">
            📜
          </div>
          <h3 class="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">Brugervilkår (Terms)</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Fastlægger udelukkende AISP læseadgang (ingen betalingsinitiering/PISP) og ansvarsfraskrivelse.
          </p>
        </div>
        <span class="text-xs font-semibold text-purple-400 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          Læs Brugervilkår →
        </span>
      </a>

      <a href="/help" class="p-6 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition-all group flex flex-col justify-between">
        <div class="space-y-2">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg mb-3">
            🧭
          </div>
          <h3 class="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">Hjælp & Bankforbindelse</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            5-trins vejledning til opsætning af Enable Banking kontrolpanelet og MitID login med Nordea.
          </p>
        </div>
        <span class="text-xs font-semibold text-emerald-400 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          Åbn Vejledning →
        </span>
      </a>

      <a href="/about" class="p-6 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl transition-all group flex flex-col justify-between">
        <div class="space-y-2">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg mb-3">
            ℹ️
          </div>
          <h3 class="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">Om & Kontakt</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Information om systemarkitektur, Open Banking certificering og GitHub repository link.
          </p>
        </div>
        <span class="text-xs font-semibold text-amber-400 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          Læs mere & kontakt →
        </span>
      </a>
    </div>

  </div>

  <!-- Footer -->
  <footer class="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
    <div class="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
      <span>Homebanking • Open Banking PSD2 AISP</span>
      <div class="flex items-center gap-4">
        <a href="/privacy" class="hover:text-slate-300 transition-colors">Privatliv</a>
        <a href="/terms" class="hover:text-slate-300 transition-colors">Vilkår</a>
        <a href="/help" class="hover:text-slate-300 transition-colors">Hjælp</a>
        <a href="/about" class="hover:text-slate-300 transition-colors">Om</a>
        <a href="https://github.com/Razsk/homebanking" target="_blank" class="hover:text-slate-300 transition-colors">GitHub</a>
      </div>
    </div>
  </footer>
</body>
</html>'''

    with open(os.path.join(dist_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(index_html)
    print("Generated ./dist/index.html")

    print(f"\n=== Build Complete! Total files in ./dist: {len(os.listdir(dist_dir))} items ===")
    for item in sorted(os.listdir(dist_dir)):
        print(f" - {item}")

if __name__ == "__main__":
    build_dist()


