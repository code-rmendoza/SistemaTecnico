"use client";

import { useState } from "react";
import {
  calcularPresupuesto,
  crearOrden,
  generarCodigo,
  transicionar,
  type Orden
} from "@/modules/orders/service";

function demo(): Orden[] {
  const o1 = crearOrden(
    { clienteId: "cli_1", equipoId: "eq_1", fallaDeclarada: "No enciende" },
    generarCodigo(2026, 1)
  );
  const o2 = transicionar(
    crearOrden(
      { clienteId: "cli_2", equipoId: "eq_2", fallaDeclarada: "Pantalla rota" },
      generarCodigo(2026, 2)
    ),
    "DIAGNOSTICO",
    "tecnico@taller.ve"
  );
  return [o1, o2];
}

export default function OrdenesPage() {
  const [ordenes] = useState<Orden[]>(demo);
  const ejemplo = calcularPresupuesto({
    manoObraUSD: 20,
    repuestos: [{ sku: "REP-0001", cantidad: 1, precioUSD: 25 }],
    tasaRef: 40
  });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold">Órdenes (demo local hasta migrate)</h1>
      <p className="mt-1 text-xs opacity-70">
        Presupuesto ejemplo: {ejemplo.totalUSDRef} USD = {ejemplo.totalVES} Bs (tasa {ejemplo.tasaRef}).
        QR imprimible: el código OT es único por orden.
      </p>
      <ul className="mt-4 divide-y">
        {ordenes.map((o) => (
          <li key={o.id} className="py-2 text-sm">
            <strong>{o.codigo}</strong> — {o.estado} — {o.fallaDeclarada}
          </li>
        ))}
      </ul>
    </main>
  );
}
