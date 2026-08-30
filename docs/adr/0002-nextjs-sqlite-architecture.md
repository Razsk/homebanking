# 2. Next.js og SQLite som Kernestak

## Kontekst
Applikationen er en personlig finansiel dashboard-løsning, der skal køre lokalt på brugerens maskine med høj performance, god dataintegritet og fuldt privatliv uden eksterne cloud-databaser.

## Beslutning
Vi bygger løsningen som en **Next.js (App Router, TypeScript)** fullstack applikation med **Tailwind CSS**, **Recharts** til visualiseringer og en lokal **SQLite** database drevet af **Prisma ORM**.

## Konsekvenser
- Ingen krav om eksterne servere, Docker eller cloud-databaser; databasen gemmes som en lokal `.db`-fil.
- UI og API-routes samlet i ét repository og proces, hvilket minimerer kompleksitet ved OAuth/MitID callback og lokal kørsel.
