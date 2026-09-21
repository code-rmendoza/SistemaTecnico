# ADR-003: Enforcement de roles en layouts server, sin middleware

## Status
Accepted

## Date
2026-09-21

## Context
Se implementó `middleware.ts` (Edge) con `jsonwebtoken` para proteger rutas por rol. En verificación con curl se demostró que **nunca se ejecutaba**: `/ordenes` sin sesión devolvía 200 y `/admin` 404 en vez del 307 esperado, sin rastro de compilación del middleware en los logs. Causa probable: `jsonwebtoken` (Node-only) en Edge runtime.

## Decision
- Eliminar `middleware.ts` (un guard que no corre es peor que ninguno: da falsa seguridad).
- Enforcement en layouts server (`src/lib/require-role.ts`, runtime Node): sin sesión → 307 `/login`; rol indebido → 404 (no filtra existencia); también aplicado en `/api/clientes` (GET roles internos, POST solo admin/recepción).
- Helper `src/lib/edge-auth.ts` (WebCrypto HS256, sin dependencias Node) queda con tests como pieza reutilizable si se reintroduce middleware.
- Verificado por curl: 307/404/200 según caso, más e2e 6/6.

## Alternatives Considered

### Middleware con librería Edge-compatible (jose)
- Pros: 403 reales en el borde, una sola capa.
- Cons: nueva dependencia + re-verificación completa; el problema detectado exige primero entender por qué el archivo se ignoraba.
- Rejected (por ahora): reevaluar si se necesita 403 explícito o rate-limit en el borde.

### Solo middleware, sin layouts
- Pros: menos archivos.
- Cons: es exactamente lo que falló en silencio.
- Rejected: defensa en la capa que sí se ejecuta y se puede testear.

## Consequences
- Cada sección protegida necesita su `layout.tsx` (olvidarlo deja la ruta abierta → checklist de review).
- El 404 ante rol indebido es intencional (no revela existencia), distinto del 403 original del SPEC.
- Si se reintroduce middleware, debe verificarse con curl que compila y redirige antes de confiar en él.
