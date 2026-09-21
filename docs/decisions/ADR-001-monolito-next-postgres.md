# ADR-001: Monolito modular Next.js + PostgreSQL/Prisma

## Status
Accepted

## Date
2026-09-21

## Context
Taller de electrónica general (Venezuela) que sale del papel/Excel. Equipo chico, sin capacidad ops. Se necesita web + móvil sin instalar nada, con transacciones ACID para stock y caja (todo consumo sale de una orden o ajuste auditado).

## Decision
Monolito modular Next.js 14 (App Router, PWA responsive) + API REST en Route Handlers + PostgreSQL 16 + Prisma. Módulos por `CAPABILITY-MAP.md`: clients, inventory → orders → billing, portal.

## Alternatives Considered

### Microservicios
- Pros: escalado independiente por servicio.
- Cons: overhead operativo (red, deploys, observabilidad) injustificado para un taller.
- Rejected: complejidad sin beneficio a esta escala.

### Firebase/Supabase BaaS
- Pros: arranque rápido, auth incluida.
- Cons: lógica transaccional (stock atómico, caja dual) queda en cliente o functions; lock-in; costo en USD.
- Rejected: las invariantes críticas exigen transacciones controladas en servidor propio.

### Apps nativas (iOS/Android)
- Pros: mejor experiencia móvil.
- Cons: doble código, tiendas, instalación para clientes ocasionales.
- Rejected: la PWA cubre "web + móvil" con un solo deploy.

## Consequences
- Un deploy, una DB, migraciones versionadas en `prisma/`.
- Transacciones ACID para stock/caja; auditoría quién/cuándo/antes/después.
- Migrable a NestJS o a nativo si el volumen lo exige (ver SPEC Open Questions).
