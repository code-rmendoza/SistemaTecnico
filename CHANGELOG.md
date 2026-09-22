# Changelog

## [1.1.0] - 2026-09-21

### Added
- Asignar técnico a órdenes (dropdown en detalle, badge en lista)
- Fotos de equipos/daño (upload por URL o archivo, galería, eliminación)
- Reportes con filtros por rango de fechas
- Exportar CSV (cobros por día, métodos de pago, cuentas por cobrar)
- Rate-limit general en APIs críticas (cobros, caja, transiciones, presupuesto)
- Security headers (CSP, X-Frame-Options, HSTS, Referrer-Policy)
- `.env.example` con variables documentadas
- `capability-map.md` con mapa de capacidades del sistema

### Changed
- UI modernizada: sidebar colapsable con SVG icons, topbar glass-blur
- Dashboard con stats reales del backend (KPIs, pipeline, gráfico 7 días)
- Toast notifications flotantes (reemplaza alerts inline)
- Skeleton components para loading states
- Sidebar responsive con hamburger en mobile
- Pagination reutilizable en todas las listas
- Login centrado con gradient background y branding
- Órdenes detalle con tabs (Flujo/Presupuesto/Fotos/Historial)
- Móvil page con datos reales de la API
- Inventario y Usuarios con tablas y búsqueda

## [1.0.0] - 2026-09-21

### Added
- Auth JWT httpOnly 8h con 4 roles (admin/recepcion/tecnico/cliente)
- Enforcement de roles en layouts server
- CRUD completo: clientes, equipos, inventario, órdenes
- Presupuestos con aprobación y deducción atómica de stock
- Cobros duales VES/USD con imputación mixta
- Caja diaria (apertura/cierre/movimientos)
- Tasa de cambio manual diaria
- Portal público para consulta de clientes
- State machine de 9 estados para órdenes
- Dashboard con estadísticas
- CI/CD: lint, tsc, test+coverage, build, audit
- Deploy: Vercel + Neon PostgreSQL
- 43 tests unitarios/integración + 6 e2e
- ADRs (001-004)
