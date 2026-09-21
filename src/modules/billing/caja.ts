export interface MovimientoCaja {
  id: string;
  moneda: "VES" | "USD";
  monto: number;
  concepto: string;
  fecha: Date;
}

export interface Caja {
  fecha: string;
  usuario: string;
  tasa: number;
  inicialVES: number;
  inicialUSD: number;
  movimientos: MovimientoCaja[];
  cerrada: boolean;
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function abrirCaja(args: {
  fecha: string;
  usuario: string;
  tasa: number;
  inicialVES: number;
  inicialUSD: number;
}): Caja {
  if (!args.tasa || args.tasa <= 0) {
    throw new Error("Apertura exige tasa del día válida");
  }
  return { ...args, movimientos: [], cerrada: false };
}

export function registrarMovimiento(
  caja: Caja,
  mov: { moneda: "VES" | "USD"; monto: number; concepto: string }
): Caja {
  if (caja.cerrada) throw new Error("Caja cerrada");
  return {
    ...caja,
    movimientos: [...caja.movimientos, { ...mov, id: uid("mc"), fecha: new Date() }]
  };
}

function esperado(caja: Caja, moneda: "VES" | "USD"): number {
  const inicial = moneda === "VES" ? caja.inicialVES : caja.inicialUSD;
  return (
    inicial +
    caja.movimientos.filter((m) => m.moneda === moneda).reduce((acc, m) => acc + m.monto, 0)
  );
}

export function cerrarCaja(
  caja: Caja,
  args: { contadoVES: number; contadoUSD: number; tasaCierre: number }
): {
  esperadoVES: number;
  esperadoUSD: number;
  diferenciaVES: number;
  diferenciaUSD: number;
  totalVESConvertido: number;
} {
  const esperadoVES = esperado(caja, "VES");
  const esperadoUSD = esperado(caja, "USD");
  return {
    esperadoVES,
    esperadoUSD,
    diferenciaVES: args.contadoVES - esperadoVES,
    diferenciaUSD: args.contadoUSD - esperadoUSD,
    totalVESConvertido: args.contadoVES + args.contadoUSD * args.tasaCierre
  };
}
