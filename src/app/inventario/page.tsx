"use client";

import { useState } from "react";
import { bajoMinimo, crearRepuesto, type Repuesto } from "@/modules/inventory/service";

const DEMO: Repuesto[] = [
  crearRepuesto({ sku: "REP-0001", nombre: "Pantalla 6.5", stock: 2, stockMinimo: 2, costoUSD: 12.5, precioUSD: 25, ubicacion: "A-01" }),
  crearRepuesto({ sku: "REP-0002", nombre: "Batería 5000mAh", stock: 8, stockMinimo: 3, costoUSD: 6, precioUSD: 15, ubicacion: "A-02" })
];

export default function InventarioPage() {
  const [repuestos] = useState<Repuesto[]>(DEMO);
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold">Inventario (demo local hasta migrate)</h1>
      <ul className="mt-4 divide-y">
        {repuestos.map((r) => (
          <li key={r.id} className="py-2 text-sm">
            <strong>{r.sku}</strong> {r.nombre} — stock {r.stock}
            {bajoMinimo(r) && <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-red-700">¡Stock mínimo!</span>}
          </li>
        ))}
      </ul>
    </main>
  );
}
