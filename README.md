# Sistema Técnico — Taller de Electrónica General (VE)

Gestión de taller: órdenes de servicio, clientes/equipos, inventario de repuestos, facturación con caja dual VES/USD y portal de consulta. Localización Venezuela (es-VE, America/Caracas).

## Quick Start

1. Clonar: `git clone https://github.com/code-rmendoza/SistemaTecnico.git`
2. Instalar: `npm ci`
3. Entorno: `cp .env.example .env` (ajústalo; nunca commitees `.env`)
4. DB local: `docker run -d --name st-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sistema_tecnico -p 5433:5432 postgres:16`
5. Migrar + seed: `npx prisma migrate dev` + `npm run db:seed`
6. Dev: `npm run dev` → http://localhost:3000

Demo: `admin@taller.ve` / `recepcion@taller.ve` / `tecnico@taller.ve` / `cliente@taller.ve` — clave `demo1234` (solo desarrollo).

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Servidor desarrollo |
| `npm test -- --coverage` | Suite (umbral 80% en dominio) |
| `npx tsc --noEmit` | Tipos |
| `npm run lint` | ESLint |
| `npm run build` | Build producción |
| `npx playwright test` | E2E (requiere dev + `playwright install`) |
| `npm run db:seed` | Datos demo |

## Architecture

Monolito modular Next.js 14 + PostgreSQL/Prisma ([ADR-001](docs/decisions/ADR-001-monolito-next-postgres.md)). Módulos (`CAPABILITY-MAP.md`): clients, inventory → orders → billing, portal. Precios en USD con tasa diaria y caja dual ([ADR-002](docs/decisions/ADR-002-tasa-diaria-caja-dual.md)). Auth por roles en layouts server ([ADR-003](docs/decisions/ADR-003-auth-en-layouts.md)). CI con audit advisory ([ADR-004](docs/decisions/ADR-004-audit-advisory.md)).

Docs: [SPEC](SPEC-sistema-tecnico.md) · [Plan](tasks/plan.md) · [Decisiones](docs/decisions/) · [Intención](docs/intent/sistema-tecnico.md)

## Contributing

`main` protegido: todo cambio entra por PR con CI `quality` en verde + 1 approval. Commits atómicos (`feat/fix/chore/docs/test`), sin secretos en el diff.
