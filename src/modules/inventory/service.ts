import { z } from "zod";

export const RepuestoInput = z.object({
  sku: z.string().min(3),
  nombre: z.string().min(2),
  compatible: z.string().optional(),
  stock: z.number().int().min(0),
  stockMinimo: z.number().int().min(0),
  costoUSD: z.number().min(0),
  precioUSD: z.number().min(0),
  ubicacion: z.string().optional()
});
export type RepuestoInput = z.infer<typeof RepuestoInput>;

export interface Repuesto extends RepuestoInput {
  id: string;
}

export const MovimientoInput = z.object({
  tipo: z.enum(["ENTRADA", "SALIDA_ORDEN", "AJUSTE"]),
  cantidad: z.number().int().min(1),
  refOrden: z.string().optional(),
  motivo: z.string().optional(),
  usuario: z.string().min(1)
});
export type MovimientoInput = z.infer<typeof MovimientoInput>;

export interface Movimiento extends MovimientoInput {
  id: string;
  sku: string;
  stockAntes: number;
  stockDespues: number;
  creadoEn: Date;
  signo: 1 | -1;
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function crearRepuesto(input: RepuestoInput): Repuesto {
  const data = RepuestoInput.parse(input);
  return { ...data, id: uid("rep") };
}

export function bajoMinimo(r: Repuesto): boolean {
  return r.stock <= r.stockMinimo;
}

export function moverStock(
  repuesto: Repuesto,
  movimientos: Movimiento[],
  input: { tipo: "ENTRADA" | "SALIDA_ORDEN" | "AJUSTE"; cantidad: number; refOrden?: string; motivo?: string; usuario: string }
): { repuesto: Repuesto; movimiento: Movimiento; movimientos: Movimiento[] } {
  const parsed = MovimientoInput.parse({ ...input, cantidad: Math.abs(input.cantidad) });

  if (parsed.tipo === "SALIDA_ORDEN" && !parsed.refOrden) {
    throw new Error("SALIDA_ORDEN exige refOrden");
  }
  if (parsed.tipo === "AJUSTE" && !parsed.motivo) {
    throw new Error("AJUSTE exige motivo auditado");
  }

  const signo: 1 | -1 = parsed.tipo === "ENTRADA" ? 1 : -1;
  const aplicada = parsed.tipo === "AJUSTE" ? input.cantidad : parsed.cantidad * signo;
  const stockDespues = repuesto.stock + aplicada;

  if (stockDespues < 0) {
    throw new Error("Stock insuficiente: requiere AJUSTE auditado");
  }

  const movimiento: Movimiento = {
    ...parsed,
    id: uid("mov"),
    sku: repuesto.sku,
    stockAntes: repuesto.stock,
    stockDespues,
    creadoEn: new Date(),
    signo
  };
  const actualizado = { ...repuesto, stock: stockDespues };
  return { repuesto: actualizado, movimiento, movimientos: [...movimientos, movimiento] };
}

export function kardexPorSku(movimientos: Movimiento[], sku: string): Movimiento[] {
  return movimientos.filter((m) => m.sku === sku);
}
