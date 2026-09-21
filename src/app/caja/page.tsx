"use client";

import { useEffect, useState } from "react";

interface OrdenCobro {
  id: string;
  codigo: string;
}

const METODOS = ["EFECTIVO_VES", "EFECTIVO_USD", "PAGO_MOVIL", "TRANSFERENCIA_VES", "TRANSFERENCIA_USD", "TARJETA"];

export default function CajaPage() {
  const [tasa, setTasa] = useState<{ valorVESporUSD: number; fecha: string } | null>(null);
  const [nuevaTasa, setNuevaTasa] = useState("");
  const [codigo, setCodigo] = useState("");
  const [orden, setOrden] = useState<(OrdenCobro & { saldoVES: number }) | null>(null);
  const [metodo, setMetodo] = useState("EFECTIVO_VES");
  const [monto, setMonto] = useState("");
  const [resumen, setResumen] = useState<{ esperadoVES: number; esperadoUSD: number } | null>(null);
  const [contadoVES, setContadoVES] = useState("");
  const [contadoUSD, setContadoUSD] = useState("");
  const [cierre, setCierre] = useState<{ diferenciaVES: number; diferenciaUSD: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function cargar() {
    const [rt, rc] = await Promise.all([fetch("/api/tasa"), fetch("/api/caja")]);
    if (rt.ok) {
      const d = await rt.json();
      if (d.tasa) setTasa({ valorVESporUSD: Number(d.tasa.valorVESporUSD), fecha: String(d.tasa.fecha).slice(0, 10) });
    }
    if (rc.ok) {
      const d = await rc.json();
      setResumen({ esperadoVES: d.esperadoVES, esperadoUSD: d.esperadoUSD });
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function guardarTasa(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/tasa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valorVESporUSD: Number(nuevaTasa) })
    });
    if (!res.ok) {
      setError("Solo admin puede fijar la tasa");
      return;
    }
    setNuevaTasa("");
    cargar();
  }

  async function buscarOrden(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOrden(null);
    const res = await fetch(`/api/ordenes?codigo=${encodeURIComponent(codigo)}`);
    if (!res.ok) {
      setError("Orden no encontrada o sin presupuesto");
      return;
    }
    const d = await res.json();
    setOrden({ id: d.orden.id, codigo: d.orden.codigo, saldoVES: d.saldoVES });
  }

  async function cobrar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    if (!orden) return;
    const moneda = metodo.includes("USD") ? "USD" : "VES";
    const res = await fetch("/api/cobros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ordenId: orden.id,
        lineas: [{ metodo, moneda, monto: Number(monto) }]
      })
    });
    const d = await res.json().catch(() => null);
    if (!res.ok) {
      setError(d?.error ?? "Cobro rechazado");
      return;
    }
    setMsg(`Cobrado. Vuelto: ${d.vueltoVES} Bs`);
    setMonto("");
    setOrden(null);
    setCodigo("");
    cargar();
  }

  async function cerrar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!tasa) {
      setError("Sin tasa del día");
      return;
    }
    const res = await fetch("/api/caja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contadoVES: Number(contadoVES),
        contadoUSD: Number(contadoUSD),
        tasaCierre: tasa.valorVESporUSD
      })
    });
    const d = await res.json().catch(() => null);
    if (!res.ok) {
      setError(d?.error ?? "No se pudo cerrar");
      return;
    }
    setCierre({ diferenciaVES: d.diferenciaVES, diferenciaUSD: d.diferenciaUSD });
    cargar();
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold">Caja</h1>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {msg && <p className="mt-2 text-sm text-green-700">{msg}</p>}

      <section className="mt-3 rounded border p-3">
        <h2 className="text-sm font-bold">Tasa del día{tasa ? `: ${tasa.valorVESporUSD} Bs/USD` : " (sin fijar)"}</h2>
        <form onSubmit={guardarTasa} className="mt-2 flex gap-2">
          <label className="sr-only" htmlFor="tasa">Nueva tasa</label>
          <input id="tasa" className="w-32 rounded border p-2" value={nuevaTasa} onChange={(e) => setNuevaTasa(e.target.value)} placeholder="Bs por USD" inputMode="decimal" />
          <button className="rounded bg-black px-3 py-1 text-white">Fijar (admin)</button>
        </form>
      </section>

      <section className="mt-3 rounded border p-3">
        <h2 className="text-sm font-bold">Cobrar orden</h2>
        <form onSubmit={buscarOrden} className="mt-2 flex gap-2">
          <label className="sr-only" htmlFor="cod">Código OT</label>
          <input id="cod" className="rounded border p-2" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="OT-2026-0001" />
          <button className="rounded border px-3 py-1">Buscar</button>
        </form>
        {orden && (
          <form onSubmit={cobrar} className="mt-2 flex flex-col gap-2">
            <p className="text-sm"><strong>{orden.codigo}</strong> — saldo {orden.saldoVES} Bs</p>
            <div className="flex gap-2">
              <label className="sr-only" htmlFor="met">Método</label>
              <select id="met" className="rounded border p-2" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                {METODOS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <label className="sr-only" htmlFor="monto">Monto</label>
              <input id="monto" className="rounded border p-2" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Monto" inputMode="decimal" required />
            </div>
            <button className="rounded bg-black p-2 text-white">Cobrar</button>
          </form>
        )}
      </section>

      <section className="mt-3 rounded border p-3">
        <h2 className="text-sm font-bold">Cierre del día</h2>
        {resumen && <p className="text-sm">Esperado: {resumen.esperadoVES} Bs + {resumen.esperadoUSD} USD</p>}
        <form onSubmit={cerrar} className="mt-2 flex gap-2">
          <label className="sr-only" htmlFor="cves">Contado Bs</label>
          <input id="cves" className="w-32 rounded border p-2" value={contadoVES} onChange={(e) => setContadoVES(e.target.value)} placeholder="Contado Bs" inputMode="decimal" required />
          <label className="sr-only" htmlFor="cusd">Contado USD</label>
          <input id="cusd" className="w-32 rounded border p-2" value={contadoUSD} onChange={(e) => setContadoUSD(e.target.value)} placeholder="Contado USD" inputMode="decimal" required />
          <button className="rounded bg-black px-3 py-1 text-white">Cerrar</button>
        </form>
        {cierre && <p className="mt-1 text-sm">Diferencia: {cierre.diferenciaVES} Bs, {cierre.diferenciaUSD} USD</p>}
      </section>
    </main>
  );
}
