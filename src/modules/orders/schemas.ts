import { z } from "zod";
import { OrderStatus } from "@/lib/order-status";

export const OrdenInput = z.object({
  clienteId: z.string().min(1, "orden sin cliente no permitida"),
  equipoId: z.string().min(1, "orden sin equipo no permitida"),
  fallaDeclarada: z.string().min(3),
  prioridad: z.enum(["BAJA", "NORMAL", "ALTA", "URGENTE"]).default("NORMAL"),
  fechaPromesa: z.string().optional()
});
export type OrdenInput = z.infer<typeof OrdenInput>;

export const PresupuestoItem = z.object({
  sku: z.string().min(1),
  cantidad: z.number().int().min(1),
  precioUSD: z.number().min(0)
});
export type PresupuestoItem = z.infer<typeof PresupuestoItem>;

export const PresupuestoInput = z.object({
  manoObraUSD: z.number().min(0),
  repuestos: z.array(PresupuestoItem),
  tasaRef: z.number().positive(),
  validezDias: z.number().int().min(1).default(7)
});
export type PresupuestoInput = z.infer<typeof PresupuestoInput>;

export const EstadoSchema = OrderStatus;
