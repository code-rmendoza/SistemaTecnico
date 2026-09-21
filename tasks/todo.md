# Tasks: Sistema Técnico Electrónica General (Venezuela v1)

Fuente: SPEC-sistema-tecnico.md + CAPABILITY-MAP.md + tasks/plan.md

## Task 1: Setup proyecto + base técnica

**Description:** Inicializar monorepo Next.js+TS+Tailwind+PWA, Prisma/Postgres, scripts build/test/lint/dev, CI mínima.

**Acceptance criteria:**
- [ ] `npm run dev`, `npm run build`, `npm run lint`, `npm test` corren sin errores
- [ ] Prisma conecta y migra en local
- [ ] PWA shell instalable y responsive base

**Verification:**
- [ ] Tests pass: `npm test -- --coverage`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: home carga en desktop y móvil 360px

**Dependencies:** None

**Files likely touched:**
- `package.json`
- `prisma/schema.prisma`
- `src/app/layout.tsx`

**Estimated scope:** Medium: 3-5 files

## Task 2: Auth + RBAC + layout por rol

**Description:** Login email/password, sesiones JWT httpOnly, roles admin/recepcion/tecnico/cliente, guards en API y UI.

**Acceptance criteria:**
- [ ] Login/logout por rol, rutas protegidas redirigen a 403/login
- [ ] Cliente solo accede a portal, técnico solo a asignadas

**Verification:**
- [ ] Tests pass: `npm test -- tests/unit/auth.test.ts`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: login con 4 roles

**Dependencies:** Task 1

**Files likely touched:**
- `src/lib/auth.ts`
- `src/app/login/page.tsx`
- `tests/unit/auth.test.ts`

**Estimated scope:** Medium: 3-5 files

## Task 3: Schema base + migraciones + seed

**Description:** Modelar Cliente, Equipo, Repuesto, Orden, Presupuesto, Cobro/CobroLinea, TasaCambio, CajaDiaria/MovimientoCaja + `canTransition` central + seed demo.

**Acceptance criteria:**
- [ ] Migración aplica limpio, seed crea demo sin datos reales
- [ ] Transición inválida rechazada a nivel dominio

**Verification:**
- [ ] Tests pass: `npm test -- tests/unit/order-status.test.ts`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: `npx prisma studio` muestra tablas

**Dependencies:** Task 1

**Files likely touched:**
- `prisma/schema.prisma`
- `src/lib/order-status.ts`
- `prisma/seed.ts`

**Estimated scope:** Medium: 3-5 files

## Checkpoint: Fundación (tras T1-T3)

- [ ] All tests pass
- [ ] Application builds without errors
- [ ] Login por rol funciona
- [ ] Review con humano antes de seguir

## Task 4: clients — CRUD + historial (SPEC-clients)

**Description:** CRUD clientes (cédula/RIF, teléfono) y equipos (IMEI/serie, fotos, fallas), búsqueda <1s, historial órdenes.

**Acceptance criteria:**
- [ ] Búsqueda por teléfono/cédula encuentra en <1s con datos seed
- [ ] No se crea orden sin cliente+equipo (validado en API)
- [ ] Historial por cliente/equipo visible

**Verification:**
- [ ] Tests pass: `npm test -- tests/integration/clients.test.ts`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: alta cliente+equipo <2min

**Dependencies:** Task 2, Task 3

**Files likely touched:**
- `src/modules/clients/*`
- `src/app/clientes/page.tsx`
- `tests/integration/clients.test.ts`

**Estimated scope:** Medium: 3-5 files

## Task 5: inventory — repuestos + movimientos (SPEC-inventory)

**Description:** CRUD repuestos (SKU, stock, mínimo, costo/precio USD), movimientos ENTRADA/SALIDA_ORDEN/AJUSTE auditados, alerta stock mínimo, kardex.

**Acceptance criteria:**
- [ ] Stock nunca negativo sin ajuste auditado (API 422 si intenta)
- [ ] Alerta visible cuando stock <= mínimo
- [ ] Kardex por SKU con quién/cuándo/motivo

**Verification:**
- [ ] Tests pass: `npm test -- tests/integration/inventory.test.ts`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: entrada→salida→ajuste cuadra

**Dependencies:** Task 2, Task 3

**Files likely touched:**
- `src/modules/inventory/*`
- `src/app/inventario/page.tsx`
- `tests/integration/inventory.test.ts`

**Estimated scope:** Medium: 3-5 files

## Checkpoint: Base (tras T4-T5)

- [ ] Tests de clientes e inventario en verde
- [ ] Auditoría stock verificable
- [ ] Review con humano

## Task 6: orders — OT + máquina estados (SPEC-orders)

**Description:** Alta OT con código único/QR, flujo INGRESADA→…→ENTREGADA, asignación técnico, diagnóstico, fotos antes/después.

**Acceptance criteria:**
- [ ] Código único OT-YYYY-NNNN + QR imprimible
- [ ] 100% transiciones inválidas rechazadas (422)
- [ ] Auditoría de estados completa

**Verification:**
- [ ] Tests pass: `npm test -- tests/integration/orders-status.test.ts`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: recepcion crea, técnico diagnostica

**Dependencies:** Task 4, Task 5

**Files likely touched:**
- `src/modules/orders/*`
- `src/app/ordenes/page.tsx`
- `tests/integration/orders-status.test.ts`

**Estimated scope:** Medium: 3-5 files

## Task 7: orders — presupuesto + consumo stock atómico

**Description:** Presupuesto mano obra+repuestos en USD con conversión VES, aprobación explícita cliente, consumo stock en transacción atómica al pasar a EN_REPARACION.

**Acceptance criteria:**
- [ ] Sin aprobación no pasa a EN_REPARACION (422)
- [ ] Al aprobar/descontar, stock baja exactamente lo usado o revierte todo
- [ ] Presupuesto guarda tasaRef, totalVES, totalUSDRef

**Verification:**
- [ ] Tests pass: `npm test -- tests/integration/orders-budget.test.ts`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: presupuesto→aprobación→reparación descuenta

**Dependencies:** Task 6

**Files likely touched:**
- `src/modules/orders/budget.ts`
- `src/app/ordenes/[id]/presupuesto.tsx`
- `tests/integration/orders-budget.test.ts`

**Estimated scope:** Medium: 3-5 files

## Checkpoint: Core (tras T6-T7)

- [ ] Flujo INGRESADA→EN_REPARACION solo con aprobación
- [ ] Stock cuadra en concurrencia simulada
- [ ] E2E parcial en verde
- [ ] Review con humano

## Task 8: billing — tasa USD diaria (SPEC-billing)

**Description:** CRUD TasaCambio (una vigente/día, solo admin), bloqueo cobro dual sin tasa, recálculo con confirmación si tasa cambió.

**Acceptance criteria:**
- [ ] Apertura caja exige tasa del día; sin tasa, cobro dual 422
- [ ] Cambio de tasa muestra diferencia y exige confirmación
- [ ] Historial tasas auditado

**Verification:**
- [ ] Tests pass: `npm test -- tests/integration/tasa.test.ts`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: cambiar tasa recalcula ticket

**Dependencies:** Task 7

**Files likely touched:**
- `src/modules/billing/tasa.ts`
- `src/app/caja/tasa.tsx`
- `tests/integration/tasa.test.ts`

**Estimated scope:** Small: 1-2 files

## Task 9: billing — cobros mixtos + vuelto + caja dual

**Description:** Cobros N líneas (EFECTIVO_VES/USD, PAGO_MOVIL, TRANSFERENCIA, TARJETA), vuelto default Bs. con redondeo + vuelto USD validado, caja dual con cierre por moneda y reportes VES/USD.

**Acceptance criteria:**
- [ ] Cobro mixto imputa exacto en VES con tasa del cobro; sobrepago solo con vuelto registrado
- [ ] Vuelto USD→VES ej. 20 USD paga 15 USD a tasa 40 = 200 Bs como egreso
- [ ] Cierre muestra esperado vs contado VES y USD + total convertido

**Verification:**
- [ ] Tests pass: `npm test -- tests/integration/billing.test.ts`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: cobrar mixto + cerrar caja dual cuadra

**Dependencies:** Task 8

**Files likely touched:**
- `src/modules/billing/*`
- `src/app/caja/page.tsx`
- `tests/integration/billing.test.ts`

**Estimated scope:** Medium: 3-5 files

## Task 10: portal — consulta + móvil técnicos (SPEC-portal)

**Description:** Portal OT+cédula solo lectura con timeline, rate-limit anti-enumeración; PWA cola técnicos, cambio estado, fotos/notas, consulta stock.

**Acceptance criteria:**
- [ ] Código erróneo no filtra datos (401 genérico + rate-limit)
- [ ] Técnico solo ve/cambia asignadas desde móvil
- [ ] PWA 360px sin scroll horizontal crítico

**Verification:**
- [ ] Tests pass: `npx playwright test e2e/portal.spec.ts`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: cliente consulta sin llamar

**Dependencies:** Task 7 (lectura órdenes); ideal tras Task 9 para saldos

**Files likely touched:**
- `src/app/portal/page.tsx`
- `src/app/movil/page.tsx`
- `e2e/portal.spec.ts`

**Estimated scope:** Medium: 3-5 files

## Checkpoint: Dinero + portal (tras T8-T10)

- [ ] Cobro mixto + vuelto + cierre dual verificados
- [ ] Portal seguro y móvil usable
- [ ] Review con humano

## Task 11: E2E completo + endurecimiento

**Description:** Flujo recepcion→técnico→admin→cliente de punta a punta, cobertura >=80% core, hardening, PWA y performance base.

**Acceptance criteria:**
- [ ] E2E orden completa en verde (crear→diagnosticar→presupuestar→aprobar→reparar→cobrar→entregar→consultar)
- [ ] Cobertura >=80% en orders/billing/inventory
- [ ] Checklist seguridad portal + auditoría en verde

**Verification:**
- [ ] Tests pass: `npm test -- --coverage`
- [ ] Build succeeds: `npm run build`
- [ ] E2E: `npx playwright test`

**Dependencies:** Task 4-Task 10

**Files likely touched:**
- `e2e/orden-completa.spec.ts`
- `tests/*`
- `src/**/*` (fixes menores)

**Estimated scope:** Medium: 3-5 files

## Checkpoint: Completo

- [ ] All acceptance criteria met
- [ ] Success criteria del SPEC verificados
- [ ] Ready for review → pasar a IMPLEMENT por slices
