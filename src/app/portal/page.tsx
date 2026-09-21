"use client";

import { useState } from "react";

interface Resultado {
  codigo: string;
  estado: string;
  falla: string;
  fechaPromesa: string | null;
}

export default function PortalPage() {
  const [codigo, setCodigo] = useState("");
  const [identidad, setIdentidad] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResultado(null);
    setLoading(true);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, identidad })
      });
      if (!res.ok) {
        // Error genérico a propósito: no revela si falló código o identidad.
        setError("Orden no encontrada");
        return;
      }
      setResultado(await res.json());
    } catch {
      setError("Orden no encontrada");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <h1 className="text-xl font-bold">Consultar estado</h1>
      <p className="mt-1 text-xs opacity-70">Ingresa código OT + cédula o teléfono.</p>
      <form onSubmit={buscar} className="mt-4 flex flex-col gap-3">
        <label className="sr-only" htmlFor="codigo">Código de orden</label>
        <input id="codigo" className="w-full rounded border p-2" placeholder="OT-2026-0001" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
        <label className="sr-only" htmlFor="identidad">Cédula o teléfono</label>
        <input id="identidad" className="w-full rounded border p-2" placeholder="cédula o teléfono" value={identidad} onChange={(e) => setIdentidad(e.target.value)} required />
        <button className="rounded bg-black p-2 text-white disabled:opacity-50" disabled={loading}>
          {loading ? "Buscando…" : "Consultar"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {resultado && (
        <div className="mt-4 rounded border p-3 text-sm">
          <p><strong>{resultado.codigo}</strong> — {resultado.estado}</p>
          <p className="opacity-70">{resultado.falla}</p>
          {resultado.fechaPromesa && <p className="opacity-70">Promesa: {String(resultado.fechaPromesa).slice(0, 10)}</p>}
        </div>
      )}
    </main>
  );
}
