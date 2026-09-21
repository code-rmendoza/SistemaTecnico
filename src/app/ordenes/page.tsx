"use client";

import { useEffect, useState } from "react";

interface Cliente {
  id: string;
  nombre: string;
  cedulaRif: string;
  equipos: { id: string; marca: string; modelo: string; tipo: string }[];
}

interface Orden {
  id: string;
  codigo: string;
  estado: string;
  fallaDeclarada: string;
  equipo: { marca: string; modelo: string; cliente: { nombre: string } };
}

export default function OrdenesPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [equipoId, setEquipoId] = useState("");
  const [falla, setFalla] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    const [ro, rc] = await Promise.all([fetch("/api/ordenes"), fetch("/api/clientes")]);
    if (ro.ok) setOrdenes((await ro.json()).ordenes);
    if (rc.ok) setClientes((await rc.json()).clientes);
  }

  useEffect(() => {
    cargar();
  }, []);

  const equipos = clientes.find((c) => c.id === clienteId)?.equipos ?? [];

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/ordenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clienteId, equipoId, fallaDeclarada: falla })
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "No se pudo crear");
      return;
    }
    setClienteId("");
    setEquipoId("");
    setFalla("");
    cargar();
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold">Órdenes</h1>

      <form onSubmit={crear} className="mt-4 flex flex-col gap-2 rounded border p-3">
        <h2 className="text-sm font-bold">Nueva orden</h2>
        <label className="sr-only" htmlFor="cli">Cliente</label>
        <select id="cli" className="rounded border p-2" value={clienteId} onChange={(e) => { setClienteId(e.target.value); setEquipoId(""); }} required>
          <option value="">Cliente…</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre} — {c.cedulaRif}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="eq">Equipo</label>
        <select id="eq" className="rounded border p-2" value={equipoId} onChange={(e) => setEquipoId(e.target.value)} required>
          <option value="">Equipo…</option>
          {equipos.map((q) => (
            <option key={q.id} value={q.id}>{q.marca} {q.modelo}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="falla">Falla declarada</label>
        <input id="falla" className="rounded border p-2" placeholder="Falla declarada" value={falla} onChange={(e) => setFalla(e.target.value)} required minLength={3} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="rounded bg-black p-2 text-white">Crear OT</button>
      </form>

      <ul className="mt-4 divide-y">
        {ordenes.map((o) => (
          <li key={o.id} className="py-2 text-sm">
            <a className="underline" href={`/ordenes/${o.id}`}>
              <strong>{o.codigo}</strong>
            </a>{" "}
            — {o.estado} — {o.equipo.marca} {o.equipo.modelo} ({o.equipo.cliente.nombre})
          </li>
        ))}
      </ul>
      {ordenes.length === 0 && <p className="mt-2 text-sm opacity-60">Sin órdenes todavía.</p>}
    </main>
  );
}
