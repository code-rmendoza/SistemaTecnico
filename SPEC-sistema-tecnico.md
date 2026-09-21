# Spec: Sistema de Servicios Técnicos y Electrónica (v1)

## ASSUMPTIONS I'M MAKING

1. Web responsive PWA cubre "Web + móvil" sin apps nativas en v1 (menor costo, sin instalación).
2. Monolito modular con API REST + PostgreSQL (no microservicios para un taller).
3. Auth email/password + roles: admin, recepcion, tecnico, cliente. Sesión JWT en cookie httpOnly.
4. Facturación interna v1 (comprobante interno, no fiscal SENIAT). Caja diaria simple por usuario/turno.
5. Español (es-VE), moneda VES (Bs.) con referencia USD, zona horaria America/Caracas.
6. Navegadores modernos (Chrome/Edge/Firefox últimos 2 años), mobile Chrome/Safari.
→ Corríjanme ahora o avanzo con esto.

## Objective

Sistema para taller de electrónica general (celulares, PCs, tablets, consolas) que ordene el flujo
ingreso → diagnóstico → presupuesto → aprobación cliente → reparación → control calidad → entrega + garantía,
con clientes, inventario de repuestos, facturación/caja y portal de consulta.

Usuarios:
- Recepción: alta clientes/equipos/órdenes, entrega, cobros.
- Técnico: diagnostica, registra trabajo, consume repuestos, cambia estados.
- Admin/dueño: precios, stock, caja, reportes, usuarios y permisos.
- Cliente: consulta estado con código + historial (portal, sin instalar nada).

Éxito v1:
- 100% órdenes con código único trazable y estados auditados.
- Tiempo ingreso < 2 min con cliente/equipo existente.
- Stock cuadra: todo consumo sale de una orden o ajuste auditado.
- Caja diaria cierra sin diferencias no explicadas.
- Cliente consulta estado sin llamar al taller.

Fuera de v1: notificaciones automáticas, pagos online, factura fiscal SENIAT.

## Tech Stack

- Frontend: Next.js 14 (React 18) + TypeScript 5 + Tailwind, PWA responsive.
- Backend: Next.js Route Handlers o NestJS 10 (Node 20 LTS) API REST JSON.
- DB: PostgreSQL 16 + Prisma ORM.
- Auth: JWT en cookie httpOnly + bcrypt.
- Docs API: OpenAPI.
- A definir si se prefiere otro stack antes de codificar (ver Open Questions).

## Commands

```bash
Build: npm run build
Test: npm test -- --coverage
Lint: npm run lint
Dev: npm run dev
DB migrate: npx prisma migrate dev
DB studio: npx prisma studio
E2E: npx playwright test
```

Requiere Node 20+, PostgreSQL 16 local o Docker.

## Project Structure

```text
src/               → Código aplicación (frontend + API)
src/app            → Rutas Next.js (recepción, técnico, admin, portal)
src/modules/clients, orders, inventory, billing, portal → Lógica por módulo del CAPABILITY-MAP
src/lib            → Auth, db, utils compartidos
prisma/            → schema.prisma + migraciones
tests/             → Unit + integración (vitest)
e2e/               → Playwright (flujo orden completa, caja)
docs/intent/       → Intención confirmada
SPEC-*.md + CAPABILITY-MAP.md → Especificaciones
```

## Code Style

TypeScript estricto, nombres en inglés para código, UI en español. Validar todo input en borde API con zod.

```ts
// Bueno: estado explícito + auditoría, nunca string libre
import { z } from "zod";

export const OrderStatus = z.enum([
  "INGRESADA","DIAGNOSTICO","PRESUPUESTADA","APROBADA",
  "EN_REPARACION","CONTROL_CALIDAD","LISTA_ENTREGA","ENTREGADA","CANCELADA"
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  const flow: Record<OrderStatus, OrderStatus[]> = {
    INGRESADA: ["DIAGNOSTICO","CANCELADA"],
    DIAGNOSTICO: ["PRESUPUESTADA","CANCELADA"],
    PRESUPUESTADA: ["APROBADA","CANCELADA"],
    APROBADA: ["EN_REPARACION","CANCELADA"],
    EN_REPARACION: ["CONTROL_CALIDAD"],
    CONTROL_CALIDAD: ["LISTA_ENTREGA","EN_REPARACION"],
    LISTA_ENTREGA: ["ENTREGADA"],
    ENTREGADA: [],
    CANCELADA: [],
  };
  return flow[from].includes(to);
}
```

Convenciones: kebab-case archivos, camelCase funciones, UPPER_SNAKE estados, Prisma para DB, nunca SQL crudo sin revisión.

## Testing Strategy

- Framework: Vitest (unit/integración) + Playwright (e2e). Cobertura mínima 80% en orders/billing/inventory.
- Dónde: `tests/unit`, `tests/integration`, `e2e/`.
- Niveles:
  - Unit: transiciones estado, cálculo presupuesto, cierre caja.
  - Integración: crear orden → consumir stock → cobrar → entregar descuenta stock y cuadra caja.
  - E2E: recepción crea orden, técnico repara, admin cobra, cliente consulta portal.
- Datos: seed mínimo + fixtures, nunca prod.

## Boundaries

- Always: correr tests antes de commit, validar inputs (zod), auditar cambios de estado/stock/caja (quién/cuándo/antes/después), control de acceso por rol en cada endpoint.
- Ask first: cambios de schema DB, agregar dependencias, cambiar stack, tocar CI/config, exponer datos cliente en portal.
- Never: commitear secretos/.env, borrar tests fallando sin aprobación, permitir transición de estado inválida, stock negativo sin ajuste auditado, ver datos de otros clientes en portal.

## Módulos (trazan a CAPABILITY-MAP.md)

### 1. clients — Clientes y equipos
- Cliente: nombre, cédula/RIF, teléfono, email, dirección. Búsqueda por teléfono/cédula en <1s.
- Equipo: tipo (celular/PC/tablet/consola), marca, modelo, IMEI/serie, clave patrón (cifrada), accesorios, fotos ingreso, fallas declaradas.
- Historial por cliente/equipo: órdenes, presupuestos, garantías.
- Regla: no se crea orden sin cliente + equipo.

### 2. inventory — Repuestos
- Repuesto: SKU, nombre, marca compatible, stock, stock mínimo, costo, precio, ubicación.
- Movimientos: ENTRADA (compra), SALIDA_ORDEN (vinculada a orden), AJUSTE (con motivo + usuario). Nunca stock negativo sin ajuste.
- Alerta stock <= mínimo en dashboard. Kardex por SKU.
- Contrato: `POST /api/inventory/movements` exige {sku, tipo, cantidad, refOrden?}.

### 3. orders — Órdenes (core)
- Código único ej. `OT-2026-0001`, QR imprimible para etiqueta.
- Estados: INGRESADA → DIAGNOSTICO → PRESUPUESTADA → APROBADA → EN_REPARACION → CONTROL_CALIDAD → LISTA_ENTREGA → ENTREGADA (CANCELADA desde INGRESADA/DIAGNOSTICO/PRESUPUESTADA/APROBADA).
- Campos: cliente, equipo, falla, diagnóstico técnico, trabajos, repuestos usados (descuentan stock), fotos antes/después, técnico asignado, prioridad, fechas promesa/entrega, garantía días.
- Presupuesto: mano obra + repuestos, validez días, requiere aprobación explícita cliente (firma/check + fecha). Sin aprobación no pasa a EN_REPARACION.
- Auditoría completa de transiciones.

### 4. billing — Facturación, tasa USD y caja dual VES/USD
- Comprobante interno (no fiscal v1): detalle mano obra + repuestos, descuentos, IVA 16% si aplica, total VES + referencia USD con tasa aplicada visible.
- Precios se cargan en USD como referencia estable; el sistema convierte a VES con tasa vigente. Presupuesto guarda `tasaRef, totalVES, totalUSDRef, fechaTasa`. Si la tasa cambia antes del cobro, el sistema recalcula y pide confirmación mostrando diferencia.
- Tasa USD (manual/diaria v1):
  - Entidad `TasaCambio {fecha, valorVESporUSD, fuente: MANUAL, usuario, vigenteDesde}`. Una vigente por día.
  - Apertura de caja exige confirmar tasa del día. Sin tasa del día no hay cobros duales.
  - Solo admin edita tasa del día; tasas de días con caja cerrada solo admin con motivo auditado.
  - A futuro se podrá sumar tasa BCV automática; v1 100% manual.
- Cobros mixtos v1 (registro manual): un cobro admite N líneas `{metodo, moneda, monto}`.
  Métodos: EFECTIVO_VES, EFECTIVO_USD, PAGO_MOVIL, TRANSFERENCIA_VES, TRANSFERENCIA_USD, TARJETA.
  Total imputado en VES = suma(lineas VES) + suma(lineas USD * tasaCobro). Debe cubrir total adeudado.
  Señas/pagos parciales se imputan a la orden y reducen saldo.
- Vuelto:
  - Regla default: vuelto en VES (Bs.) por falta de denominación USD baja.
  - Cálculo: `vueltoVES = entregadoUSD*tasaCobro + entregadoVES - totalVESadeudado`, redondeado a múltiplo configurable (default 1 Bs).
  - Vuelto en USD solo si hay disponibilidad en caja y con aprobación (valida denominaciones 1,5,10,20,50,100). Se registra `vueltoMoneda, vueltoMonto`.
  - Nunca hay vuelto en Pago Móvil/transferencia/tarjeta, solo en efectivo. Todo vuelto queda en ticket y en movimiento de caja como egreso.
- Caja diaria dual por turno/usuario: apertura con conteo inicial VES + USD, movimientos por moneda/método, cierre con esperado vs contado por moneda + diferencia por moneda + total convertido a VES con tasa de cierre. Solo admin reabre con motivo.
- Reportes: ingresos por día/mes, por técnico, por tipo equipo, cuentas por cobrar, ticket promedio — todos en VES y USD (con tasa usada).

### 5. portal — Consulta cliente + móvil técnicos
- Cliente ingresa código OT + cédula/teléfono para ver timeline (sin datos de otros). Solo lectura.
- Móvil: PWA responsive, técnicos ven cola asignada, cambian estado, agregan fotos/notas, consultan stock.
- Rate-limit + no enumeración de órdenes.

## Roles y permisos (resumen)

| Acción | Admin | Recepción | Técnico | Cliente |
|---|---|---|---|---|
| Crear cliente/equipo/orden | Sí | Sí | No | No |
| Diagnosticar / cargar trabajo | Sí | No | Sí (asignadas) | No |
| Consumir repuesto | Sí | No | Sí | No |
| Presupuestar / cobrar / caja | Sí | Sí | No | No |
| Gestionar tasa del día | Sí | No | No | No |
| Cambiar estado | Sí | Ingreso/Entrega | Técnicos | No |
| Ver reportes | Sí | Parcial | Propias | No |
| Portal consulta | — | — | — | Solo suyas |

## Datos mínimos (entidades)

Cliente(1)—(*)Equipo(1)—(*)Orden(*)—(*)RepuestoUso(*)—(1)Repuesto; Orden(1)—(*)Presupuesto(1)—(*)Cobro(1)—(*)CobroLinea; TasaCambio(1)—(*)Cobro/Presupuesto (tasaRef); CajaDiaria(1)—(*)MovimientoCaja (por moneda/metodo); Usuario(*)—(*)Orden (asignado/historial).

## Success Criteria (testables)

- [ ] Crear orden con cliente existente en <2 min (e2e medido).
- [ ] Transición inválida (ej. INGRESADA→ENTREGADA) rechazada 100% (test unit + API 422).
- [ ] Consumir repuesto sin stock bloquea o exige ajuste auditado (test integración).
- [ ] Presupuesto sin aprobación no permite EN_REPARACION (test).
- [ ] Caja: cobrado = movimientos caja del día por moneda; cierre calcula diferencia VES y USD por separado (test).
- [ ] Tasa: sin tasa del día se bloquea cobro dual (test API 422); cambio de tasa recalcula total y exige confirmación (test).
- [ ] Vuelto USD→VES: paga 20 USD por cuenta de 15 USD a tasa 40 = vuelto 200 Bs registrado como egreso (test integración).
- [ ] Portal con código erróneo no filtra datos (test seguridad).
- [ ] Cobertura >=80% en orders/billing/inventory, e2e flujo completo en verde.
- [ ] PWA usable en móvil 360px sin scroll horizontal crítico (check manual + Playwright).

## Open Questions

1. ¿Stack definitivo Next.js+Prisma+Postgres o prefieren otro (ej. PHP/Laravel, Firebase)?
2. ¿Garantía estándar cuántos días? ¿Se cobra diagnóstico no aprobado?
3. ¿Número OT con qué formato? ¿Etiqueta térmica?
4. ¿Caja única o por sucursal/turno? Confirmado dual VES/USD por turno. Falta: ¿redondeo vuelto en Bs a qué múltiplo? ¿Vuelto USD permitido siempre o solo excepciones?
7. ¿Fuente tasa a futuro: BCV automática o seguir manual? v1 manual confirmado.
5. ¿Fotos se guardan local o nube (límite tamaño)?
6. ¿Migran datos de Excel actual? ¿En qué formato están?

## Aprobación

- [ ] Mapa de capacidades aprobado
- [ ] Supuestos validados
- [ ] Spec aprobado → pasar a Plan (tasks/plan.md) y Tasks
