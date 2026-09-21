# Implementation Plan: Sistema Técnico Electrónica General (Venezuela v1)

## Overview

Construir monolito modular Next.js + API REST + PostgreSQL/Prisma con PWA responsive, siguiendo CAPABILITY-MAP.md (clients, inventory → orders → billing, portal). Localización es-VE, VES con referencia USD, America/Caracas. Tasa USD manual/diaria obligatoria, caja dual VES/USD, vuelto default en Bs. Sin integraciones externas en v1.

Trazabilidad: SPEC-sistema-tecnico.md + CAPABILITY-MAP.md. Tasks en `tasks/todo.md`.

## Architecture Decisions

- Monolito modular Next.js 14 + TypeScript + Tailwind PWA (cubre web+móvil sin apps nativas) — rationale: menor costo, un deploy.
- API REST en Route Handlers (migrable a NestJS si crece) + Prisma + PostgreSQL 16 — rationale: simple para taller, transacciones ACID para stock/caja.
- Auth JWT en cookie httpOnly + roles admin/recepcion/tecnico/cliente — rationale: portal seguro sin exponer datos ajenos.
- Precios en USD referencia, totales en VES con tasa vigente; presupuesto congela tasaRef — rationale: estabilidad de precios en Venezuela.
- Validación zod en borde API + máquina de estados `canTransition` centralizada — rationale: SPEC exige 0 transiciones inválidas.
- Auditoría (quién/cuándo/antes/después) en estados, stock, tasa y caja — rationale: criterio de éxito.

## Dependency Graph

```
Postgres + Prisma schema (Cliente, Equipo, Repuesto, Orden, Presupuesto, Cobro, TasaCambio, Caja)
  → Auth + RBAC
    → clients (CRUD + historial)
    → inventory (CRUD + movimientos + alertas)
      → orders (máquina estados + presupuesto + consumo stock)
        → billing (tasa diaria + cobros mixtos + vuelto + caja dual + reportes)
        → portal (consulta por código + vista móvil técnicos)
  → Seed + fixtures
```

Orden bottom-up, slices verticales: cada módulo entrega schema + API + UI mínima testeable.

## Task List (índice — detalle en tasks/todo.md)

### Fase 1: Fundación
- [ ] T1: Setup proyecto + CI base (lint, test, build, Prisma, PWA shell)
- [ ] T2: Auth + RBAC + layout por rol
- [ ] T3: Schema base + migraciones + seed (clientes/equipos demo, sin datos reales)

Checkpoint: Fundación — tests, build, login por rol.

### Fase 2: Base (paralelizable tras T3)
- [ ] T4: clients — CRUD clientes/equipos + historial + búsqueda cédula/teléfono
- [ ] T5: inventory — CRUD repuestos + movimientos auditados + alerta stock mínimo

Checkpoint: Base — crear cliente/equipo y mover stock con auditoría.

### Fase 3: Core
- [ ] T6: orders — OT con código/QR + máquina estados + diagnóstico + fotos
- [ ] T7: orders — presupuesto (mano obra + repuestos) + aprobación explícita + consumo stock atómico

Checkpoint: Core — flujo INGRESADA→APROBADA→EN_REPARACION bloquea sin aprobación y descuenta stock.

### Fase 4: Dinero + portal (tras T7)
- [ ] T8: billing tasa — TasaCambio diaria obligatoria + recálculo con confirmación
- [ ] T9: billing cobros/caja — cobros mixtos + vuelto VES/USD + caja dual + reportes VES/USD
- [ ] T10: portal — consulta por OT+cédula (solo lectura, rate-limit) + cola móvil técnicos

Checkpoint: Dinero — cobro mixto cuadra, vuelto registrado, cierre dual sin diferencias.

### Fase 5: Endurecimiento
- [ ] T11: E2E completo + PWA móvil 360px + cobertura >=80% core + hardening portal

Checkpoint: Completo — todos los success criteria del SPEC en verde, listo para review.

## Parallelization

- Paralelo seguro tras T3: T4 y T5 (no comparten tablas críticas salvo Usuario).
- Paralelo tras T7: T8 y T10 (tasa vs portal lectura); T9 depende de T8.
- Secuencial obligatorio: T6→T7→T8→T9 (stock→presupuesto→tasa→caja comparten invariantes).
- Coordinación: contrato `OrderStatus/canTransition` y `TasaCambio vigente` se definen en T3/T6 y no se cambian sin aviso.

## Risks and Mitigations

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Tasa cambia entre presupuesto y cobro y genera reclamos | Alto | Congelar tasaRef en presupuesto, mostrar diferencia y exigir confirmación explícita |
| Vuelto USD sin denominación disponible | Alto | Default vuelto Bs., vuelto USD solo con disponibilidad validada + aprobación |
| Stock negativo por consumo concurrente | Alto | Transacción DB atómica orden↔stock, bloqueo o ajuste auditado, test integración |
| Portal enumera OTs ajenas | Alto | OT+cédula/teléfono, rate-limit, tests seguridad, nunca listar |
| Fotos saturan disco | Medio | Límite tamaño, compresión, cuota, pregunta abierta local vs nube |
| Alcance crece (SENIAT, BCV auto, WhatsApp) | Medio | Fuera de v1 explícito, feature flags para no bloquear |

## Open Questions (del SPEC, bloquean detalle no arranque)

1. Stack definitivo Next.js+Prisma+Postgres u otro.
2. Garantía días + ¿diagnóstico no aprobado se cobra?
3. Formato OT + etiqueta térmica/QR.
4. Redondeo vuelto Bs. + ¿vuelto USD siempre o excepción?
5. Fotos local vs nube.
6. Migración Excel actual.
7. ¿Recepción puede cargar tasa o solo admin? (v1: solo admin).

## Verificación por checkpoint

- Tests: `npm test -- --coverage` (foco por módulo en cada tarea).
- Build: `npm run build`.
- E2E: `npx playwright test` desde T6 en adelante.
- Manual: ingreso <2min, PWA 360px, cierre dual cuadra.
