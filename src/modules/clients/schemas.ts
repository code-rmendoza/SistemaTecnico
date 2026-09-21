import { z } from "zod";

export const ClienteInput = z.object({
  nombre: z.string().min(2),
  cedulaRif: z.string().min(5),
  telefono: z.string().min(7),
  email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  direccion: z.string().optional()
});
export type ClienteInput = z.infer<typeof ClienteInput>;

export const EquipoInput = z.object({
  clienteId: z.string().min(1, "equipo sin cliente no permitido"),
  tipo: z.enum(["celular", "PC", "tablet", "consola", "otro"]),
  marca: z.string().min(1),
  modelo: z.string().min(1),
  serieImei: z.string().optional(),
  accesorios: z.string().optional()
});
export type EquipoInput = z.infer<typeof EquipoInput>;
