import { z } from "zod";

export const OrderStatus = z.enum([
  "INGRESADA",
  "DIAGNOSTICO",
  "PRESUPUESTADA",
  "APROBADA",
  "EN_REPARACION",
  "CONTROL_CALIDAD",
  "LISTA_ENTREGA",
  "ENTREGADA",
  "CANCELADA"
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

const flow: Record<OrderStatus, OrderStatus[]> = {
  INGRESADA: ["DIAGNOSTICO", "CANCELADA"],
  DIAGNOSTICO: ["PRESUPUESTADA", "CANCELADA"],
  PRESUPUESTADA: ["APROBADA", "CANCELADA"],
  APROBADA: ["EN_REPARACION", "CANCELADA"],
  EN_REPARACION: ["CONTROL_CALIDAD"],
  CONTROL_CALIDAD: ["LISTA_ENTREGA", "EN_REPARACION"],
  LISTA_ENTREGA: ["ENTREGADA"],
  ENTREGADA: [],
  CANCELADA: []
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return flow[from].includes(to);
}
