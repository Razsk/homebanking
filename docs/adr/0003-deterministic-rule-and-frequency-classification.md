# 3. Deterministisk Regel- og Frekvensbaseret Klassificering

## Kontekst
Kontobevægelser skal automatisk inddeles i kategorier (indtægter, faste omkostninger, variable forbrugsområder) og abonnementer skal identificeres pålideligt uden utilsigtede hallucinationer eller afhængighed af betalte cloud-API'er.

## Beslutning
Vi anvender en to-trins klassificeringsmotor:
1. **Deterministiske regler**: Regex og tekstmatch på modpart/posteringstekst mod en prioriteret regel-tabel.
2. **Statistisk frekvens- og intervalanalyse**: Automatisk detektion af abonnementer baseret på ensartet modpart, ensartet beløb (+/- tolerance) og regulære tidsintervaller (ugentlig, månedlig, kvartalsvis, årlig).

## Konsekvenser
- 100% reproducerbar, lynhurtig og lokal udførelse.
- Brugeren kan tilpasse, overstyre og oprette nye regler direkte i UI'et.
