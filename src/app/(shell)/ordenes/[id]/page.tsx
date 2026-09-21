"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, EstadoBadge, Field, Page, inputCls } from "@/components/ui";
import { cn } from "@/components/cn";

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

type Tab = "transiciones" | "presupuesto" | "historial";

export default function OrdenDetalle({ params }: { params: { id: string } }) {
  const [orden, setOrden] = useState<Orden | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("transiciones");
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

  if (error && !orden)
    return (
      <Page>
        <Alert>{error}</Alert>
      </Page>
    );
  if (!orden)
    return (
      <Page>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Cargando…
        </div>
      </Page>
    );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "transiciones", label: "Flujo", icon: <IconArrow className="h-4 w-4" /> },
    { id: "presupuesto", label: "Presupuesto", icon: <IconDoc className="h-4 w-4" /> },
    { id: "historial", label: "Historial", icon: <IconClock className="h-4 w-4" /> },
  ];

  return (
    <Page wide>
      <a className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800 font-medium" href="/ordenes">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Órdenes
      </a>

      {/* Header */}
      <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{orden.codigo}</h1>
            <EstadoBadge estado={orden.estado} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {orden.fallaDeclarada} · <span className="font-medium">{orden.prioridad}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(SIGUIENTES[orden.estado] ?? []).map((s) => (
            <Button
              key={s}
              variant={s === "CANCELADA" ? "danger" : "primary"}
              onClick={() => transicionar(s)}
            >
              {s === "CANCELADA" ? "Cancelar" : `→ ${s.replace(/_/g, " ")}`}
            </Button>
          ))}
        </div>
      </div>
      {error && <Alert>{error}</Alert>}

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2",
              tab === t.id
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4 animate-fade-in">
        {tab === "transiciones" && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Estado actual</h3>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <IconCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{orden.estado.replace(/_/g, " ")}</p>
                <p className="text-xs text-slate-500">Estado actual de la orden</p>
              </div>
            </div>
          </Card>
        )}

        {tab === "presupuesto" && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Presupuesto</h3>
            {orden.presupuesto ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Mano de obra</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{String(orden.presupuesto.manoObraUSD)} USD</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Tasa</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{String(orden.presupuesto.tasaRef)} Bs</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total</p>
                    <p className="mt-1 text-lg font-bold text-emerald-700">{String(orden.presupuesto.totalVES)} Bs</p>
                  </div>
                </div>
                {(orden.presupuesto.items ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Repuestos</p>
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          <tr>
                            <th className="px-3 py-2">SKU</th>
                            <th className="px-3 py-2 text-right">Cant.</th>
                            <th className="px-3 py-2 text-right">Precio</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(orden.presupuesto.items ?? []).map((r, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 font-medium text-slate-900">{r.sku}</td>
                              <td className="px-3 py-2 text-right text-slate-600">{r.cantidad}</td>
                              <td className="px-3 py-2 text-right text-slate-600">{String(r.precioUSD)} USD</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <span className="text-sm text-slate-600">Estado:</span>
                  <span className={cn("badge-pill", orden.presupuesto.aprobada ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200")}>
                    {orden.presupuesto.aprobada ? "Aprobado" : "Pendiente"}
                  </span>
                </div>
                {!orden.presupuesto.aprobada && orden.estado === "PRESUPUESTADA" && (
                  <Button onClick={aprobar} className="w-full">Aprobar presupuesto</Button>
                )}
              </div>
            ) : (
              <form onSubmit={presupuestar} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="mo" label="Mano de obra (USD)">
                    <input id="mo" className={inputCls} value={manoObra} onChange={(e) => setManoObra(e.target.value)} placeholder="20" inputMode="decimal" />
                  </Field>
                  <Field id="tasa" label="Tasa (Bs/USD)">
                    <input id="tasa" className={inputCls} value={tasa} onChange={(e) => setTasa(e.target.value)} placeholder="40" inputMode="decimal" />
                  </Field>
                </div>
                <div className="grid grid-cols-[1fr_80px_100px_auto] gap-2 items-end">
                  <Field id="sku" label="Repuesto SKU">
                    <input id="sku" className={inputCls} value={sku} onChange={(e) => setSku(e.target.value)} placeholder="REP-0001" />
                  </Field>
                  <Field id="cant" label="Cant.">
                    <input id="cant" className={inputCls} value={cant} onChange={(e) => setCant(e.target.value)} inputMode="numeric" />
                  </Field>
                  <Field id="precio" label="Precio USD">
                    <input id="precio" className={inputCls} value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0.00" inputMode="decimal" />
                  </Field>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!sku || !precio) return;
                      setRepuestos((r) => [...r, { sku, cantidad: Number(cant) || 1, precioUSD: Number(precio) }]);
                      setSku("");
                      setCant("1");
                      setPrecio("");
                    }}
                    className="mb-0.5"
                  >
                    + Agregar
                  </Button>
                </div>
                {repuestos.length > 0 && (
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        <tr>
                          <th className="px-3 py-2">SKU</th>
                          <th className="px-3 py-2 text-right">Cant.</th>
                          <th className="px-3 py-2 text-right">Precio</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {repuestos.map((r, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 font-medium text-slate-900">{r.sku}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{r.cantidad}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{r.precioUSD} USD</td>
                            <td className="px-3 py-2 text-right">
                              <button type="button" onClick={() => setRepuestos((prev) => prev.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <Button>Presupuestar</Button>
              </form>
            )}
          </Card>
        )}

        {tab === "historial" && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Historial de cambios</h3>
            {orden.historial.length === 0 ? (
              <p className="text-sm text-slate-500">Sin movimientos registrados.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
                <ol className="space-y-4">
                  {orden.historial.map((h, i) => (
                    <li key={i} className="relative flex gap-4 pl-9">
                      <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-emerald-500 bg-white" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {h.de.replace(/_/g, " ")} → {h.a.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {h.usuario} · {String(h.fecha).slice(0, 16).replace("T", " ")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Card>
        )}
      </div>
    </Page>
  );
}

/* ── Tab icons ── */

function IconArrow({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

function IconDoc({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}
