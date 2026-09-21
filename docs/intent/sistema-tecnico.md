# Intent: Sistema de Servicios Técnicos y Electrónica

Fecha: 2026-09-21
Estado: Confirmado por usuario

## Statement of Intent

- Outcome: Sistema web + móvil para taller de electrónica general que gestione órdenes de servicio, clientes, inventario de repuestos y facturación/caja.
- User: Equipo interno (recepción, técnicos, admin) + clientes que consultan estado online.
- Why now: Ordenar el crecimiento y salir del papel/Excel con trazabilidad completa ingreso → diagnóstico → presupuesto → reparación → entrega.
- Success: Toda orden es rastreable, stock cuadra, historial por cliente/equipo consultable y caja diaria cierra.
- Constraint: Primera versión web + móvil, sin integraciones externas.
- Out of scope: Notificaciones automáticas (WhatsApp/email), pagos online y factura fiscal legal (SENIAT).

## Alcance v1 confirmado

1. Órdenes de servicio (ingreso, diagnóstico, presupuesto, reparación, entrega)
2. Gestión de clientes + historial de equipos
3. Inventario de repuestos (entradas, salidas, alertas stock)
4. Facturación y caja (cobros, facturas internas, reportes ingresos)
5. Portal cliente (consulta estado) + acceso técnicos en móvil

## Supuestos base

- Taller de electrónica general (celulares, PCs, tablets, consolas).
- Uso principal: PC en taller + celular en campo/mostrador, sin instalación (web responsive + PWA / web móvil).
- Sin integraciones en v1 por decisión explícita del usuario.
- Localización Venezuela: es-VE, VES (Bs.) con referencia USD, America/Caracas, cédula/RIF, IVA 16%.
- Moneda dual: tasa USD manual/diaria obligatoria para cobros, precios en USD de referencia, vuelto default en Bs.
