"use client";

import { useState } from "react";
import { buscarClientes, crearCliente, type Cliente } from "@/modules/clients/service";

const DEMO: Cliente[] = [
  { ...crearCliente({ nombre: "María Pérez", cedulaRif: "V-12345678", telefono: "04120000000" }) },
  { ...crearCliente({ nombre: "José Ruiz", cedulaRif: "V-87654321", telefono: "04141111111" }) }
];

export default function ClientesPage() {
  const [q, setQ] = useState("");
  const [clientes] = useState<Cliente[]>(DEMO);
  const resultados = buscarClientes(clientes, q);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold">Clientes (demo local hasta migrate)</h1>
      <label className="sr-only" htmlFor="buscar-clientes">Buscar clientes</label>
      <input
        id="buscar-clientes"
        className="mt-3 w-full rounded border p-2"
        placeholder="Buscar por nombre, cédula o teléfono"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="mt-4 divide-y">
        {resultados.map((c) => (
          <li key={c.id} className="py-2 text-sm">
            <strong>{c.nombre}</strong> — {c.cedulaRif} — {c.telefono}
          </li>
        ))}
      </ul>
      {resultados.length === 0 && <p className="mt-2 text-sm opacity-60">Sin resultados.</p>}
    </main>
  );
}
