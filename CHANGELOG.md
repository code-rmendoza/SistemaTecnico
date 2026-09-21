# Changelog

## [1.0.0] - 2026-09-21
### Added
- Órdenes de servicio con estados auditados, presupuesto USD/VES y consumo de stock atómico
- Clientes/equipos con búsqueda por cédula/teléfono e historial
- Inventario con movimientos auditados, alerta de mínimo y kardex
- Billing dual VES/USD: tasa diaria manual, cobros mixtos, vuelto en Bs., caja dual
- Portal cliente (código + cédula) y móvil para técnicos
- Auth por roles (JWT httpOnly) con rate-limit, `/api/health`, security headers
- CI con lint, tipos, tests, build y audit advisory; e2e Playwright

### Fixed
- Enforcement de roles movido de middleware (no se ejecutaba) a layouts server
- CSP con `unsafe-eval` solo en dev (rompía el HMR)

### Security
- Next.js 14.2.5 → 14.2.35, Playwright → 1.63; resto documentado en ADR-004
