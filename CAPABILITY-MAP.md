# Capability Map: Sistema Técnico Electrónica General

Fecha: 2026-09-21
Estado: Borrador para revisión (requiere aprobación antes de implementar)

| Module id | Responsabilidad | Depende de |
|---|---|---|
| clients | Clientes, equipos, historial reparaciones | — |
| inventory | Repuestos, movimientos entrada/salida, alertas stock mínimo | — |
| orders | Órdenes: ingreso → diagnóstico → presupuesto → aprobación → reparación → control calidad → entrega/garantía | clients, inventory |
| billing | Presupuestos valorizados, cobros, caja diaria, reportes ingresos | orders, clients |
| portal | Consulta estado por código para clientes + vista móvil para técnicos | orders, clients |

Build order: clients, inventory → orders → billing, portal

## Reglas

- Ids estables en kebab-case, no se renombran a mitad de iniciativa.
- Sin ciclos: billing y portal consumen a orders; nunca al revés.
- Contratos entre módulos viven en el spec del módulo proveedor.
- Cada módulo tiene su SPEC-*.md que traza a este mapa.
