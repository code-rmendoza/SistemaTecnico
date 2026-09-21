"use client";

import { useState } from "react";
import { transicionar, type Orden } from "@/modules/orders/service";
import { crearRepuesto } from "@/modules/inventory/service";

const ORDENES: Orden[] = [
  {
    id: "ot_1",
    codigo: "OT-2026-0002",
    clienteId: "cli_2",
    equipoId: "eq_2",
    fallaDeclarada: "Pantalla rota",
    prioridad: "NORMAL",
    estado: "APROBADA",
    auditoria: []
  }
];

const STOCK = [
  crearRepuesto({ sku: "REP-0001", nombre: "Pantalla 6.5", stock: 8, stockMinimo: 2, costoUSD: 12.5, precioUSD: 25 })
];

export default function MovilPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>(ORDENES);

  function avanzar(id: string) {
    setOrdenes((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        try {
          return transicionar(o, "EN_REPARACION", "tecnico@taller.ve");
        } catch {
          return o;
        }
      })
    );
  }

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <h1 className="text-lg font-bold">Mi cola (técnico demo)</h1>
      <ul className="mt-3 flex flex-col gap-2">
        {ordenes.map((o) => (
          <li key={o.id} className="rounded border p-3 text-sm">
            <p><strong>{o.codigo}</strong> — {o.estado}</p>
            <p className="opacity-70">{o.fallaDeclarada}</p>
            <button className="mt-2 rounded bg-black px-3 py-1 text-white" onClick={() => avanzar(o.id)}>
              Pasar a reparación
            </button>
          </li>
        ))}
      </ul>
      <h2 className="mt-5 text-sm font-bold">Stock consultable</h2>
      <ul className="text-sm">
        {STOCK.map((r) => (
          <li key={r.id}>{r.sku} — {r.nombre} (stock {r.stock})</li>
        ))}
      </ul>
      <p className="mt-3 text-xs opacity-70">Ruta protegida: técnico, admin. Solo muestra asignadas.</p>
    </main>
  );
}
