# Plan de Lanzamiento v1 — Sistema Técnico (VE)

Fecha: 2026-09-21 · Estado: pre-launch (staging pendiente)

## Dónde estamos (con evidencia)

| Área | Estado | Evidencia / nota |
|---|---|---|
| Tests (43) + cobertura ≥80% | ✅ | CI `quality` en verde |
| tsc + lint + build | ✅ | CI en verde |
| Auth 4 roles verificada | ✅ | Login real + guards 307/404/200 por curl, e2e 6/6 |
| DB migraciones + seed | ✅ | Postgres 16 Docker, `migrate dev` + seed OK |
| README + ADRs | ✅ | PR #6 (este cambio suma LAUNCH) |
| Audit dependencias | ⚠️ | Advisory: 10 transitivas solo vía majors (ADR-004) |
| Rate-limit login/API | ❌ | Falta; antes de exponer a internet |
| Usuarios demo hardcodeados | ❌ | Migrar a tabla Usuario antes de prod |
| Security headers (CSP/HSTS) | ❌ | Solo defaults de Next |
| Health endpoint | ❌ | Crear `/api/health` (200 + ping DB) |
| Accesibilidad formularios | ❌ | Inputs con placeholder sin `<label>` |
| Hosting + Postgres prod | ❌ | Sin decidir (opción: Vercel + Neon/Supabase) |
| Monitoreo/errores | ❌ | Sin Sentry ni logs estructurados |
| Staging | ❌ | Crear entorno previo a prod |
| CHANGELOG | ❌ | Crear al cortar v1.0.0 |

## Estrategia: staging → prod con beta interna

1. **Staging**: deploy + `migrate deploy` + seed demo + smoke (login 4 roles, OT demo, caja dual, portal).
2. **Prod con beta interna** (sin flags: v1 es todo-o-nada, pero usuarios = el taller): crear usuarios reales, tasa del día, un día de operación en paralelo con papel.
3. **Corte v1.0.0**: tag + CHANGELOG.
4. Ventana de monitoreo 1 semana (errores, latencia, caja cuadra).

## Rollback

- App: revert del commit + redeploy (< 5 min) o re-selección de deployment anterior en el host.
- DB: migraciones Prisma hacia adelante (no hay destructivas en v1); rollback = `migrate resolve` + restore del backup previo.
- Trigger: error rate > 2x, P95 > +50%, descuadre de caja, reporte crítico del taller.
- Backup diario de Postgres antes del corte y cada noche la primera semana.

## Pre-deploy obligatorio (no negociable)

- [ ] `JWT_SECRET` real (≥32 chars) en el host, `.env` jamás commiteado
- [ ] Usuarios DB reemplazan demo (`demo1234` no existe en prod)
- [ ] `/api/health` + migración aplicada + backup verificado
- [ ] Tasa del día cargada y caja de apertura en 0/0
- [ ] Rate-limit en `/api/auth/login` y portal
