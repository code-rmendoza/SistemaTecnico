# Capability Map — Sistema Técnico

Mapa de capacidades del sistema. Cada capability es una unidad independiente de funcionalidad.

## Core

| Capability | Estado | Descripción |
|------------|--------|-------------|
| `auth` | ✅ | JWT httpOnly 8h, 4 roles, enforcement en layouts server |
| `clients` | ✅ | CRUD clientes + equipos, cédula/RIF único |
| `inventory` | ✅ | CRUD repuestos, stock, kardex, bajo mínimo, movimientos |
| `orders` | ✅ | Órdenes con state machine (9 estados), prioridad, garantía |
| `budget` | ✅ | Presupuestos con items, aprobación, deducción atómica de stock |
| `billing` | ✅ | Cobros duales VES/USD, mixtos, imputación, vuelto |
| `cash` | ✅ | Caja diaria (apertura/cierre/movimientos), cuadre |
| `rate` | ✅ | Tasa de cambio manual diaria, congelada en presupuestos |
| `portal` | ✅ | Consulta pública de órdenes por código + cédula |

## Extensions

| Capability | Estado | Descripción |
|------------|--------|-------------|
| `technician-assignment` | ✅ | Asignar técnico a órdenes, badge en lista |
| `photos` | ✅ | Fotos de equipos/daño (URL + upload, galería) |
| `reports` | ✅ | Reportes con filtros por fecha, exportar CSV |
| `dashboard` | ✅ | KPIs, pipeline, gráfico 7 días, quick links |

## Infrastructure

| Capability | Estado | Descripción |
|------------|--------|-------------|
| `ci-cd` | ✅ | GitHub Actions: lint, tsc, test, build, audit |
| `deploy` | ✅ | Vercel (app) + Neon (PostgreSQL), auto-deploy main |
| `security` | ✅ | CSP, HSTS, rate-limit, X-Frame-Options, nosniff |
| `monitoring` | ❌ | Sentry/logs estructurados (pendiente v2) |
| `backup` | ⚠️ | Neon point-in-time recovery (verificar configuración) |

## Not implemented (by design)

| Capability | Razón |
|------------|-------|
| `seniat` | API del SENIAT no pública aún |
| `whatsapp` | Business API paga, requiere aprobación Meta |
| `multi-sucursal` | Taller único, complejidad innecesaria |
| `kanban` | State machine ya cubre el flujo |
| `swagger` | No hay consumidores API externos |
