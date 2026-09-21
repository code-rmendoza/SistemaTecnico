import { TasaInput } from "./schemas";

export interface Tasa extends TasaInput {
  id: string;
  creadoEn: Date;
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function guardarTasa(historial: Tasa[], input: TasaInput): Tasa[] {
  const data = TasaInput.parse(input);
  if (historial.some((t) => t.fecha === data.fecha)) {
    throw new Error(`Ya existe tasa para ${data.fecha}: requiere motivo admin`);
  }
  return [...historial, { ...data, id: uid("tasa"), creadoEn: new Date() }];
}

export function tasaVigente(historial: Tasa[], fecha: string): Tasa | undefined {
  return historial.find((t) => t.fecha === fecha);
}

export function exigirTasa(historial: Tasa[], fecha: string): Tasa {
  const t = tasaVigente(historial, fecha);
  if (!t) throw new Error(`Sin tasa del día ${fecha}: cobro dual bloqueado (422)`);
  return t;
}

export function recalcularConTasa(args: {
  totalUSDRef: number;
  tasaVieja: number;
  tasaNueva: number;
}): { totalVES: number; diferenciaVES: number; requiereConfirmacion: boolean } {
  const totalVES = args.totalUSDRef * args.tasaNueva;
  const diferenciaVES = args.totalUSDRef * (args.tasaNueva - args.tasaVieja);
  return { totalVES, diferenciaVES, requiereConfirmacion: args.tasaNueva !== args.tasaVieja };
}
