# ADR-002: Precios en USD con tasa diaria manual y caja dual VES/USD

## Status
Accepted

## Date
2026-09-21

## Context
Venezuela: los precios se piensan en USD pero se cobra en bolívares a tasa del día, más efectivo en USD sin denominaciones bajas para el vuelto. Un total fijo en VES se desactualiza en días y genera reclamos.

## Decision
- Precios cargados en USD como referencia estable; totales en VES con tasa vigente.
- `TasaCambio` manual, una vigente por día, cargada por admin al abrir caja. Sin tasa no hay cobros duales.
- Presupuesto congela `tasaRef, totalVES, totalUSDRef`; si la tasa cambia antes del cobro se recalcula con confirmación explícita.
- Cobros mixtos (efectivo VES/USD, Pago Móvil, transferencia, tarjeta) con imputación en VES.
- Vuelto default en Bs. (redondeo configurable); vuelto en USD solo con disponibilidad y aprobación.
- Caja dual: esperado vs contado por moneda + total convertido con tasa de cierre.

## Alternatives Considered

### Todo en VES con precios actualizables
- Pros: una sola moneda en el sistema.
- Cons: repreciar todo ante cada devaluación; presupuestos viejos quedan impagables o generan pérdida.
- Rejected: fricción operativa diaria.

### Tasa BCV automática desde v1
- Pros: sin carga manual.
- Cons: dependencia externa (scraping/API no oficial) antes de tener el flujo básico probado.
- Rejected: v1 manual; BCV automática queda para v2.

### Vuelto siempre en la moneda de pago
- Pros: contabilidad más simple.
- Cons: imposible en la práctica (nadie tiene $0,50 en billetes para dar vuelto).
- Rejected: la realidad manda.

## Consequences
- Cada cobro/presupuesto guarda su tasa: reportes comparables entre días.
- La apertura de caja tiene un paso extra (confirmar tasa); documentado en el flujo.
- IVA 16%, locale es-VE, zona America/Caracas.
