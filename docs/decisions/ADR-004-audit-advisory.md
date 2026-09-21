# ADR-004: Audit de seguridad como aviso no bloqueante

## Status
Accepted

## Date
2026-09-21

## Context
El gate `npm audit --audit-level=high` falló con 13 vulnerabilidades. Se corrigieron las arreglables sin breaking (Playwright 1.47→1.63, tsx→4.23: 13→10). Las restantes son transitivas cuya única vía de fix es un major breaking: postcss (vía Next 14→16), vite (vía Vitest major), glob (vía Next).

## Decision
- Subir los minors/medios con fix disponible y verificado por la suite.
- Dejar el step de audit como **advisory** (`continue-on-error`) con la justificación en el workflow, en vez de un gate eternamente rojo que entrena a ignorar el CI.
- Gates duros intactos y bloqueantes: lint, `tsc`, tests con cobertura ≥80%, build.
- Seguimiento: migración Next 16 y re-endurecimiento del gate en v2; Dependabot vigila fixes futuros.

## Alternatives Considered

### Mantener el gate duro en rojo
- Pros: "cero tolerancia" nominal.
- Cons: todo merge se vuelve override manual; el gate pierde significado en semanas.
- Rejected: teatro de seguridad.

### `npm audit fix --force`
- Pros: cero vulnerabilidades reportadas.
- Cons: instala Next 16 (breaking) sin migración evaluada; rompería la app.
- Rejected: el remedio es peor que la enfermedad.

### Silenciar audit por completo
- Pros: CI siempre verde.
- Cons: se pierde visibilidad de futuras vulnerabilidades arreglables.
- Rejected: el aviso visible + Dependabot es el equilibrio correcto.

## Consequences
- El reporte de audit sigue visible en cada run de CI.
- Re-evaluar en cada minor de Next o al planificar v2.
