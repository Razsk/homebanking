# 4. Idempotent Kontobevægelses-Pipeline

## Kontekst
Banker udsender posteringer som enten reserverede (pending) eller bogførte (booked). Reserverede posteringer kan skifte identifikator eller beløb ved endelig bogføring. Gentagne synkroniseringer må ikke skabe dubletter eller slette brugerdefinerede kategoriseringer.

## Beslutning
Vi genererer et deterministisk fingeraftryk (hash) for hver kontobevægelse baseret på `account_id`, `valørdato`, `beløb` og `tekst`. Når en postering overgår fra `pending` til `booked`, udføres et atomisk upsert, der bevarer brugerens tildelte kategori og opdaterer bogføringsstatus.

## Konsekvenser
- Sikrer 100% dataintegritet ved hyppige baggrundssynkroniseringer.
- Forhindrer tab af manuelt tildelte kategorier eller noter ved gen-synkronisering.
