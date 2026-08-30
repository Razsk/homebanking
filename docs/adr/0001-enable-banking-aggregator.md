# 1. Enable Banking som Open Banking Aggregator

## Kontekst
Vi skal integrere med Nordea i Danmark for at hente konti, saldi og kontobevægelser. Direkte bankforbindelse via PSD2 kræver egen AISP-licens fra Finanstilsynet og dyre eIDAS QWAC/QSEAL certifikater.

## Beslutning
Vi anvender **Enable Banking** som Open Banking Aggregator med en indbygget mock/sandbox-adapter. Enable Banking tilbyder asymmetrisk RS256 JWT-signering, direkte selvbetjening uden enterprise-kontrakt, og fuld dækning af danske banker med MitID.

## Konsekvenser
- Backend skal generere og håndtere et lokalt RSA-2048 nøglepar (`private.key` / `public.key`).
- Systemet skal håndtere 180-dages samtykke-livscyklus og MitID omdirigeringsflows.
- Mock-adapteren gør det muligt at teste og køre applikationen offline uden aktive API-nøgler.
