"use client";

import { useState } from "react";
import { consultarOrden, type TimelinePortal } from "@/modules/portal/service";

const DEMO = [
  {
    codigo: "OT-2026-0001",
    cedulaTelefono: "V-12345678",
    estado: "EN_REPARACION",
    tecnicoId: "tec1",
    eventos: [
      { estado: "INGRESADA", fecha: "2026-09-20" },
      { estado: "DIAGNOSTICO", fecha: "2026-09-20" }
    ]
  }
];

export default function PortalPage() {
  const [codigo, setCodigo] = useState("");
  const [identidad, setIdentidad] = useState("");
  const [resultado, setResultado] = useState<TimelinePortal | null>(null);
  const [error, setError] = useState<string | null>(null);

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResultado(null);
    try {
      setResultado(consultarOrden(DEMO, { codigo, identidad }));
    } catch {
      // Error genérico a propósito: no revela si falló código o identidad.
      setError("Orden no encontrada");
    }
  }

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <h1 className="text-xl font-bold">Consultar estado</h1>
      <p className="mt-1 text-xs opacity-70">Ingresa código OT + cédula o teléfono. Demo: OT-2026-0001 / V-12345678.</p>
      <form onSubmit={buscar} className="mt-4 flex flex-col gap-3">
        <input className="w-full rounded border p-2" placeholder="OT-2026-0001" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
        <input className="w-full rounded border p-2" placeholder="cédula o teléfono" value={identidad} onChange={(e) => setIdentidad(e.target.value)} required />
        <button className="rounded bg-black p-2 text-white">Consultar</button>
      </form>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {resultado && (
        <div className="mt-4 rounded border p-3 text-sm">
          <p><strong>{resultado.codigo}</strong> — {resultado.estado}</p>
          <ol className="mt-2 list-disc pl-5">
            {resultado.eventos.map((ev, i) => (
              <li key={i}>{ev.estado} ({ev.fecha})</li>
            ))}
          </ol>
        </div>
      )}
    </main>
  );
}
