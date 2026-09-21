"use client";

import { useState } from "react";
import { imputarCobro } from "@/modules/billing/cobros";
import { guardarTasa } from "@/modules/billing/tasa";

export default function CajaPage() {
  const [tasa] = useState(() =>
    guardarTasa([], { fecha: "2026-09-21", valorVESporUSD: 40, usuario: "admin@taller.ve" })[0]
  );
  const ejemplo = imputarCobro({
    totalVES: 600,
    tasaCobro: tasa.valorVESporUSD,
    lineas: [{ metodo: "EFECTIVO_USD", moneda: "USD", monto: 20 }]
  });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold">Caja dual (demo local)</h1>
      <p className="mt-1 text-xs opacity-70">
        Tasa del día: {tasa.valorVESporUSD} Bs/USD ({tasa.fecha}). Sin tasa no hay cobros duales.
      </p>
      <p className="mt-2 text-sm">
        Ejemplo: cuenta 600 Bs, paga 20 USD → entregado {ejemplo.entregadoVES} Bs, vuelto{" "}
        {ejemplo.vueltoVES} Bs ({ejemplo.vueltoMoneda}).
      </p>
      <p className="mt-2 text-xs opacity-70">Ruta protegida: admin, recepción.</p>
    </main>
  );
}
