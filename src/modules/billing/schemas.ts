import { z } from "zod";

export const TasaInput = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valorVESporUSD: z.number().positive(),
  usuario: z.string().min(1)
});
export type TasaInput = z.infer<typeof TasaInput>;

export const CobroLinea = z.object({
  metodo: z.enum([
    "EFECTIVO_VES",
    "EFECTIVO_USD",
    "PAGO_MOVIL",
    "TRANSFERENCIA_VES",
    "TRANSFERENCIA_USD",
    "TARJETA"
  ]),
  moneda: z.enum(["VES", "USD"]),
  monto: z.number().positive()
});
export type CobroLinea = z.infer<typeof CobroLinea>;
