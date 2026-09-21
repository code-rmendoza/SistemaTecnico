"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, EmptyState, Field, Page, PageHeader, inputCls } from "@/components/ui";
import { cn } from "@/components/cn";

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
  const [busqueda, setBusqueda] = useState("");

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
      body: JSON.stringify({ sku, nombre, stock: Number(stock), stockMinimo: 0, costoUSD: 0, precioUSD: 0 })
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

  const filtrados = repuestos.filter(
    (r) =>
      r.sku.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <Page wide>
      <PageHeader title="Inventario" sub={`${repuestos.length} repuestos registrados`} />
      {error && <Alert>{error}</Alert>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Nuevo repuesto</h2>
          <form onSubmit={crear} className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <Field id="sku" label="SKU">
                <input id="sku" className={inputCls} placeholder="REP-0001" value={sku} onChange={(e) => setSku(e.target.value)} required minLength={3} />
              </Field>
              <Field id="nom" label="Nombre">
                <input id="nom" className={inputCls} placeholder="Pantalla LCD" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
              </Field>
              <Field id="stk" label="Stock">
                <input id="stk" className={inputCls} value={stock} onChange={(e) => setStock(e.target.value)} inputMode="numeric" />
              </Field>
            </div>
            <Button>Crear repuesto</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Registrar movimiento</h2>
          <form onSubmit={mover} className="flex flex-col gap-3">
            <Field id="rep" label="Repuesto">
              <select id="rep" className={inputCls} value={movId} onChange={(e) => setMovId(e.target.value)} required>
                <option value="">Seleccionar…</option>
                {repuestos.map((r) => (
                  <option key={r.id} value={r.id}>{r.sku} — {r.nombre} (stock {r.stock})</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="tipo" label="Tipo">
                <select id="tipo" className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="ENTRADA">Entrada</option>
                  <option value="SALIDA_ORDEN">Salida por orden</option>
                  <option value="AJUSTE">Ajuste</option>
                </select>
              </Field>
              <Field id="cant" label="Cantidad">
                <input id="cant" className={inputCls} value={cantidad} onChange={(e) => setCantidad(e.target.value)} inputMode="numeric" />
              </Field>
            </div>
            {(tipo === "SALIDA_ORDEN" || tipo === "AJUSTE") && (
              <Field id="ref" label={tipo === "SALIDA_ORDEN" ? "Código OT" : "Motivo"}>
                <input id="ref" className={inputCls} placeholder={tipo === "SALIDA_ORDEN" ? "OT-2026-0001" : "Descripción del ajuste"} value={refMotivo} onChange={(e) => setRefMotivo(e.target.value)} required />
              </Field>
            )}
            <Button>Registrar movimiento</Button>
          </form>
        </Card>
      </div>

      {/* Tabla de repuestos */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Catálogo de repuestos</h2>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              className="input-modern pl-9 w-64"
              placeholder="Buscar por SKU o nombre…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {filtrados.length === 0 ? (
          <EmptyState>{repuestos.length === 0 ? "No hay repuestos registrados." : "No se encontraron resultados."}</EmptyState>
        ) : (
          <div className="rounded-xl border border-slate-200/60 bg-white shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Mínimo</th>
                  <th className="px-4 py-3 text-right">Precio USD</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{r.sku}</td>
                    <td className="px-4 py-3 text-slate-700">{r.nombre}</td>
                    <td className={cn("px-4 py-3 text-right font-semibold", r.stock <= r.stockMinimo ? "text-red-600" : "text-slate-900")}>{r.stock}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{r.stockMinimo}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{Number(r.precioUSD) > 0 ? `${String(r.precioUSD)} USD` : "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {r.stock <= r.stockMinimo ? (
                        <span className="badge-pill bg-red-50 text-red-700 ring-1 ring-red-200">Bajo</span>
                      ) : (
                        <span className="badge-pill bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  );
}
