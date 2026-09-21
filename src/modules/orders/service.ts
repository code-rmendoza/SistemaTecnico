import { z } from "zod";
import { canTransition, type OrderStatus } from "@/lib/order-status";
import { OrdenInput, PresupuestoInput } from "./schemas";
import { moverStock, type Movimiento, type Repuesto } from "@/modules/inventory/service";

export interface Auditoria {
  de: OrderStatus | "CREADA";
  a: OrderStatus;
  usuario: string;
  fecha: Date;
}

export interface Orden {
  id: string;
  codigo: string;
  clienteId: string;
  equipoId: string;
  fallaDeclarada: string;
  prioridad: string;
  estado: OrderStatus;
  auditoria: Auditoria[];
  presupuesto?: { totalUSDRef: number; totalVES: number; tasaRef: number };
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function generarCodigo(year: number, seq: number): string {
  return `OT-${year}-${String(seq).padStart(4, "0")}`;
}

export function crearOrden(input: z.input<typeof OrdenInput>, codigo: string): Orden {
  const data = OrdenInput.parse(input);
  return {
    id: uid("ot"),
    codigo,
    clienteId: data.clienteId,
    equipoId: data.equipoId,
    fallaDeclarada: data.fallaDeclarada,
    prioridad: data.prioridad,
    estado: "INGRESADA",
    auditoria: []
  };
}

export function transicionar(orden: Orden, a: OrderStatus, usuario: string): Orden {
  if (!canTransition(orden.estado, a)) {
    throw new Error(`Transición inválida ${orden.estado} → ${a}`);
  }
  return {
    ...orden,
    estado: a,
    auditoria: [...orden.auditoria, { de: orden.estado, a, usuario, fecha: new Date() }]
  };
}

export function calcularPresupuesto(input: z.input<typeof PresupuestoInput>): {
  totalUSDRef: number;
  totalVES: number;
  tasaRef: number;
} {
  const data = PresupuestoInput.parse(input);
  const repuestosUSD = data.repuestos.reduce((acc, r) => acc + r.cantidad * r.precioUSD, 0);
  const totalUSDRef = data.manoObraUSD + repuestosUSD;
  return { totalUSDRef, totalVES: totalUSDRef * data.tasaRef, tasaRef: data.tasaRef };
}

export function aprobarPresupuesto(
  orden: Orden,
  presupuesto: { totalUSDRef: number; totalVES: number; tasaRef: number },
  usuario: string
): Orden {
  if (orden.estado !== "PRESUPUESTADA") {
    throw new Error("Solo se aprueba desde PRESUPUESTADA");
  }
  const conPresupuesto: Orden = { ...orden, presupuesto };
  return transicionar(conPresupuesto, "APROBADA", usuario);
}

export function consumirStockParaOrden(
  repuestos: Record<string, Repuesto>,
  movimientos: Movimiento[],
  ordenCodigo: string,
  items: { sku: string; cantidad: number }[],
  usuario: string
): { repuestos: Record<string, Repuesto>; movimientos: Movimiento[] } {
  const copia: Record<string, Repuesto> = { ...repuestos };
  let movs = [...movimientos];
  try {
    for (const item of items) {
      const r = copia[item.sku];
      if (!r) throw new Error(`Repuesto inexistente ${item.sku}`);
      const res = moverStock(r, movs, {
        tipo: "SALIDA_ORDEN",
        cantidad: item.cantidad,
        refOrden: ordenCodigo,
        usuario
      });
      copia[item.sku] = res.repuesto;
      movs = res.movimientos;
    }
    return { repuestos: copia, movimientos: movs };
  } catch {
    throw new Error("Consumo revertido: stock insuficiente o repuesto inválido");
  }
}
