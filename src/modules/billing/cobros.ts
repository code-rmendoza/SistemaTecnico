import { CobroLinea } from "./schemas";

const EFECTIVO = ["EFECTIVO_VES", "EFECTIVO_USD"] as const;

export function imputarCobro(args: {
  totalVES: number;
  tasaCobro: number;
  lineas: CobroLinea[];
  redondeoVES?: number;
}): {
  totalVES: number;
  entregadoVES: number;
  vueltoVES: number;
  vueltoMoneda: "VES" | "USD" | null;
} {
  if (args.lineas.length === 0) throw new Error("Cobro sin líneas");
  const redondeo = args.redondeoVES ?? 1;
  let entregadoVES = 0;
  let hayEfectivo = false;
  for (const l of args.lineas) {
    const linea = CobroLinea.parse(l);
    if ((EFECTIVO as readonly string[]).includes(linea.metodo)) hayEfectivo = true;
    entregadoVES += linea.moneda === "VES" ? linea.monto : linea.monto * args.tasaCobro;
  }
  if (entregadoVES < args.totalVES) {
    throw new Error(`Faltante: entregado ${entregadoVES} < total ${args.totalVES}`);
  }
  const bruto = entregadoVES - args.totalVES;
  if (bruto > 0 && !hayEfectivo) {
    throw new Error("Sobrepago sin efectivo: no hay vuelto en Pago Móvil/transferencia/tarjeta");
  }
  const vueltoVES = Math.round(bruto / redondeo) * redondeo;
  return {
    totalVES: args.totalVES,
    entregadoVES,
    vueltoVES,
    vueltoMoneda: vueltoVES > 0 ? "VES" : null
  };
}
