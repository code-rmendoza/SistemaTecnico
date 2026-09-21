"use client";

import { useEffect, useState } from "react";

interface Orden {
  id: string;
  codigo: string;
  estado: string;
  fallaDeclarada: string;
  diagnostico: string | null;
  prioridad: string;
  historial: { de: string; a: string; usuario: string; fecha: string }[];
  presupuesto: {
    manoObraUSD: number;
    tasaRef: number;
    totalUSDRef: number;
    totalVES: number;
    aprobada: boolean;
    items?: { sku: string; cantidad: number; precioUSD: number }[];
  } | null;
}

const SIGUIENTES: Record<string, string[]> = {
  INGRESADA: ["DIAGNOSTICO", "CANCELADA"],
  DIAGNOSTICO: ["PRESUPUESTADA", "CANCELADA"],
  PRESUPUESTADA: ["APROBADA", "CANCELADA"],
  APROBADA: ["EN_REPARACION", "CANCELADA"],
  EN_REPARACION: ["CONTROL_CALIDAD"],
  CONTROL_CALIDAD: ["LISTA_ENTREGA", "EN_REPARACION"],
  LISTA_ENTREGA: ["ENTREGADA"]
};

export default function OrdenDetalle({ params }: { params: { id: string } }) {
  const [orden, setOrden] = useState<Orden | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manoObra, setManoObra] = useState("20");
  const [tasa, setTasa] = useState("40");
  const [repuestos, setRepuestos] = useState<{ sku: string; cantidad: number; precioUSD: number }[]>([]);
  const [sku, setSku] = useState("");
  const [cant, setCant] = useState("1");
  const [precio, setPrecio] = useState("");

  async function cargar() {
    const res = await fetch(`/api/ordenes/${params.id}`);
    if (!res.ok) {
      setError("Orden no encontrada");
      return;
    }
    setOrden((await res.json()).orden);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function transicionar(a: string) {
    setError(null);
    const res = await fetch(`/api/ordenes/${params.id}/transicion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a })
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Transición rechazada");
      return;
    }
    setOrden((await res.json()).orden);
  }

  async function presupuestar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/ordenes/${params.id}/presupuesto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manoObraUSD: Number(manoObra),
        repuestos,
        tasaRef: Number(tasa),
        validezDias: 7
      })
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "No se pudo presupuestar");
      return;
    }
    cargar();
  }

  async function aprobar() {
    setError(null);
    const res = await fetch(`/api/ordenes/${params.id}/presupuesto`, { method: "PUT" });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "No se pudo aprobar");
      return;
    }
    setOrden((await res.json()).orden);
  }

  if (error && !orden) return <main className="p-6"><p className="text-red-600">{error}</p></main>;
  if (!orden) return <main className="p-6"><p>Cargando…</p></main>;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <a className="text-sm underline" href="/ordenes">← Órdenes</a>
      <h1 className="mt-2 text-xl font-bold">{orden.codigo} — {orden.estado}</h1>
      <p className="text-sm opacity-70">{orden.fallaDeclarada} · Prioridad {orden.prioridad}</p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {(SIGUIENTES[orden.estado] ?? []).map((s) => (
          <button key={s} className="rounded border px-3 py-1 text-sm" onClick={() => transicionar(s)}>
            → {s}
          </button>
        ))}
      </div>

      <section className="mt-5 rounded border p-3">
        <h2 className="text-sm font-bold">Presupuesto</h2>
        {orden.presupuesto ? (
          <div className="mt-1 text-sm">
            <p>Mano de obra: {String(orden.presupuesto.manoObraUSD)} USD · Tasa {String(orden.presupuesto.tasaRef)}</p>
            {(orden.presupuesto.items ?? []).length > 0 && (
              <ul className="list-disc pl-5">
                {(orden.presupuesto.items ?? []).map((r, i) => (
                  <li key={i}>{r.cantidad}× {r.sku} @ {String(r.precioUSD)} USD</li>
                ))}
              </ul>
            )}
            <p><strong>Total: {String(orden.presupuesto.totalUSDRef)} USD = {String(orden.presupuesto.totalVES)} Bs</strong></p>
            <p>Estado: {orden.presupuesto.aprobada ? "APROBADO" : "pendiente de aprobación"}</p>
            {!orden.presupuesto.aprobada && orden.estado === "PRESUPUESTADA" && (
              <button className="mt-2 rounded bg-black px-3 py-1 text-white" onClick={aprobar}>
                Aprobar
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={presupuestar} className="mt-2 flex flex-col gap-2">
            <div className="flex gap-2">
              <label className="sr-only" htmlFor="mo">Mano de obra USD</label>
              <input id="mo" className="w-32 rounded border p-2" value={manoObra} onChange={(e) => setManoObra(e.target.value)} placeholder="Mano obra USD" inputMode="decimal" />
              <label className="sr-only" htmlFor="tasa">Tasa</label>
              <input id="tasa" className="w-24 rounded border p-2" value={tasa} onChange={(e) => setTasa(e.target.value)} placeholder="Tasa" inputMode="decimal" />
            </div>
            <div className="flex gap-2">
              <label className="sr-only" htmlFor="sku">SKU repuesto</label>
              <input id="sku" className="rounded border p-2" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" />
              <label className="sr-only" htmlFor="cant">Cantidad</label>
              <input id="cant" className="w-20 rounded border p-2" value={cant} onChange={(e) => setCant(e.target.value)} placeholder="Cant" inputMode="numeric" />
              <label className="sr-only" htmlFor="precio">Precio USD</label>
              <input id="precio" className="w-24 rounded border p-2" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="USD" inputMode="decimal" />
              <button
                type="button"
                className="rounded border px-3 py-1"
                onClick={() => {
                  if (!sku || !precio) return;
                  setRepuestos((r) => [...r, { sku, cantidad: Number(cant) || 1, precioUSD: Number(precio) }]);
                  setSku("");
                  setCant("1");
                  setPrecio("");
                }}
              >
                +
              </button>
            </div>
            {repuestos.length > 0 && (
              <ul className="text-sm">
                {repuestos.map((r, i) => (
                  <li key={i}>{r.cantidad}× {r.sku} @ {r.precioUSD} USD</li>
                ))}
              </ul>
            )}
            <button className="rounded bg-black px-3 py-1 text-white">Presupuestar</button>
          </form>
        )}
      </section>

      <section className="mt-5">
        <h2 className="text-sm font-bold">Historial</h2>
        <ol className="mt-1 list-disc pl-5 text-sm">
          {orden.historial.map((h, i) => (
            <li key={i}>{h.de} → {h.a} · {h.usuario} · {String(h.fecha).slice(0, 16).replace("T", " ")}</li>
          ))}
        </ol>
        {orden.historial.length === 0 && <p className="text-sm opacity-60">Sin movimientos.</p>}
      </section>
    </main>
  );
}
