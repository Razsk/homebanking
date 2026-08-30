# Nordea Homebanking & Finansiel Oversigt

En personlig applikation til automatisk dataforbindelse til **Nordea Danmark** via Open Banking (PSD2 / Enable Banking), automatisk to-trins udgifts- og indtægtsklassificering, abonnementssporing og interaktive finansielle dashboards.

## Funktioner

- **Nordea Open Banking Integration**: Asymmetrisk RS256 JWT-signering, MitID SCA-godkendelsesflow og 180-dages samtykkestyring via Enable Banking samt en indbygget realistisk mock-adapter.
- **Interaktivt Dashboard**: Nøgletal (Saldo, Indtægter, Udgifter, Abonnementsrate), 6-måneders cashflow-søjlediagram og kagediagram over udgiftsfordeling.
- **Kontobevægelser**: Søgning, filtrering på konti og kategorier, inline kategori-redigering og "Opret regel ud fra post"-funktion.
- **Automatisk Abonnementsdetektor**: Matematisk frekvens- og intervalanalyse ($\approx 30, 90, 365$ dages mønstre) til identifikation af faste tjenester med forfaldsdato-nedtælling.
- **Deterministisk Regelmotor**: Prioriteret regex- og tekstmatching mod posteringstekster til automatisk klassificering.
- **100% Lokalt & Privatlivssikkert**: Drevet af Next.js 14, Tailwind CSS, Recharts og en lokal SQLite-database via Prisma ORM.

## Hurtig Start

### 1. Installation

```bash
npm install
```

### 2. Klargør Database & Seed Data

```bash
npx prisma db push
npm run seed
```

### 3. Start Udviklingsserver

```bash
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000) i din browser.

## Konfiguration (Valgfrit for Live Enable Banking API)

Opret en `.env` fil med dine Enable Banking credentials:

```env
DATABASE_URL="file:./dev.db"
ENABLE_BANKING_APP_ID="dit_app_id"
ENABLE_BANKING_KEY_ID="dit_key_id"
ENABLE_BANKING_KEY_PATH="./private.key"
ENABLE_BANKING_REDIRECT_URL="http://localhost:3000/api/auth/callback"
```

Uden ovenstående nøgler kører systemet automatisk i fuld **Nordea Mock Mode** med realistiske danske bankkonti og transaktioner.

## Dokumentation

- [CONTEXT.md](./CONTEXT.md) – Domænemodel og sprog
- [docs/adr/](./docs/adr/) – Architectural Decision Records (ADRs)
