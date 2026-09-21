"use client";

import { useEffect, useState } from "react";

interface Repuesto {
  id: string;
  sku: string;
  nombre: string;
  stock: number;
  stockMinimo: number;
  precioUSD: number;
}

export default function InventarioPage() {
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [sku, setSku] = useState("");
  const [nombre, setNombre] = useState("");
  const [stock, setStock] = useState("0");
  const [movId, setMovId] = useState("");
  const [tipo, setTipo] = useState("ENTRADA");
  const [cantidad, setCantidad] = useState("1");
  const [refMotivo, setRefMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    const res = await fetch("/api/repuestos");
    if (res.ok) setRepuestos((await res.json()).repuestos);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/repuestos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku,
        nombre,
        stock: Number(stock),
        stockMinimo: 0,
        costoUSD: 0,
        precioUSD: 0
      })
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "No se pudo crear");
      return;
    }
    setSku("");
    setNombre("");
    setStock("0");
    cargar();
  }

  async function mover(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/repuestos/${movId}/movimientos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo,
        cantidad: Number(cantidad),
        refOrden: tipo === "SALIDA_ORDEN" ? refMotivo : undefined,
        motivo: tipo === "AJUSTE" ? refMotivo : undefined
      })
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Movimiento rechazado");
      return;
    }
    setCantidad("1");
    setRefMotivo("");
    cargar();
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold">Inventario</h1>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={crear} className="mt-3 flex flex-col gap-2 rounded border p-3">
        <h2 className="text-sm font-bold">Nuevo repuesto</h2>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="sku">SKU</label>
          <input id="sku" className="w-1/3 rounded border p-2" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required minLength={3} />
          <label className="sr-only" htmlFor="nom">Nombre</label>
          <input id="nom" className="w-1/3 rounded border p-2" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
          <label className="sr-only" htmlFor="stk">Stock inicial</label>
          <input id="stk" className="w-1/3 rounded border p-2" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} inputMode="numeric" />
        </div>
        <button className="rounded bg-black p-2 text-white">Crear repuesto</button>
      </form>

      <form onSubmit={mover} className="mt-3 flex flex-col gap-2 rounded border p-3">
        <h2 className="text-sm font-bold">Movimiento</h2>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="rep">Repuesto</label>
          <select id="rep" className="w-1/2 rounded border p-2" value={movId} onChange={(e) => setMovId(e.target.value)} required>
            <option value="">Repuesto…</option>
            {repuestos.map((r) => (
              <option key={r.id} value={r.id}>{r.sku} (stock {r.stock})</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="tipo">Tipo</label>
          <select id="tipo" className="rounded border p-2" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option>ENTRADA</option>
            <option>SALIDA_ORDEN</option>
            <option>AJUSTE</option>
          </select>
          <label className="sr-only" htmlFor="cant">Cantidad</label>
          <input id="cant" className="w-20 rounded border p-2" value={cantidad} onChange={(e) => setCantidad(e.target.value)} inputMode="numeric" />
        </div>
        {(tipo === "SALIDA_ORDEN" || tipo === "AJUSTE") && (
          <>
            <label className="sr-only" htmlFor="ref">Referencia o motivo</label>
            <input id="ref" className="rounded border p-2" placeholder={tipo === "SALIDA_ORDEN" ? "Código OT (ej. OT-2026-0001)" : "Motivo del ajuste"} value={refMotivo} onChange={(e) => setRefMotivo(e.target.value)} required />
          </>
        )}
        <button className="rounded bg-black p-2 text-white">Registrar</button>
      </form>

      <ul className="mt-4 divide-y">
        {repuestos.map((r) => (
          <li key={r.id} className="py-2 text-sm">
            <strong>{r.sku}</strong> {r.nombre} — stock {r.stock}
            {r.stock <= r.stockMinimo && <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-red-700">¡Stock mínimo!</span>}
          </li>
        ))}
      </ul>
    </main>
  );
}
