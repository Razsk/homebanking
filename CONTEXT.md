# Homebanking & Finansiel Oversigt

En personlig applikation til automatisk datahentning fra Nordea via Open Banking, kategorisering af kontobevægelser, visualisering af privatøkonomi og sporing af faste abonnementer.

## Language

### Bank & Integration

**Konto**:
En specifik bankkonto hos Nordea (f.eks. NemKonto, budgetkonto, opsparing) identificeret ved IBAN og kontonummer.
_Avoid_: Bankkonto, brugerkonto, account

**Kontobevægelse**:
En individuel finansiel postering på en konto med beløb, valørdato, bogføringsstatus og modpart/tekst.
_Avoid_: Transaktion, postering, betaling

**Bogføringsstatus**:
Tilstanden for en kontobevægelse, enten reserveret (pending) eller endeligt bogført (booked).
_Avoid_: Transaktionsstatus, state

**Samtykkesession**:
En tidsbegrænset PSD2-godkendelse (op til 180 dage) verificeret af brugeren via MitID, der giver læseadgang til udvalgte konti.
_Avoid_: Token, login-session, auth

### Analyse & Økonomi

**Kategori**:
En overordnet klassifikation af en kontobevægelse (f.eks. Bolig, Dagligvarer, Transport, Indkomst).
_Avoid_: Mærkat, tag, type

**Abonnement**:
En tilbagevendende, periodisk udgift (månedlig, kvartalsvis, årlig) identificeret ud fra gentagne mønstre i modpart og beløb.
_Avoid_: Fast udgift, recurrence, subscription

**Klassificeringsregel**:
Et defineret sæt af kriterier (modpart, tekst, beløb) der automatisk tildeler en kategori eller markerer en post som abonnement.
_Avoid_: Filter, regel, parser
