"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Field, Page, PageHeader, inputCls } from "@/components/ui";

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
    <Page wide>
      <PageHeader title="Inventario" />
      {error && <Alert>{error}</Alert>}

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-bold">Nuevo repuesto</h2>
          <form onSubmit={crear} className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <Field id="sku" label="SKU">
                <input id="sku" className={inputCls} placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required minLength={3} />
              </Field>
              <Field id="nom" label="Nombre">
                <input id="nom" className={inputCls} placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
              </Field>
              <Field id="stk" label="Stock inicial">
                <input id="stk" className={inputCls} placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} inputMode="numeric" />
              </Field>
            </div>
            <Button>Crear repuesto</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-2 text-sm font-bold">Movimiento</h2>
          <form onSubmit={mover} className="flex flex-col gap-2">
            <Field id="rep" label="Repuesto">
              <select id="rep" className={inputCls} value={movId} onChange={(e) => setMovId(e.target.value)} required>
                <option value="">Repuesto…</option>
                {repuestos.map((r) => (
                  <option key={r.id} value={r.id}>{r.sku} (stock {r.stock})</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field id="tipo" label="Tipo">
                <select id="tipo" className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option>ENTRADA</option>
                  <option>SALIDA_ORDEN</option>
                  <option>AJUSTE</option>
                </select>
              </Field>
              <Field id="cant" label="Cantidad">
                <input id="cant" className={inputCls} value={cantidad} onChange={(e) => setCantidad(e.target.value)} inputMode="numeric" />
              </Field>
            </div>
            {(tipo === "SALIDA_ORDEN" || tipo === "AJUSTE") && (
              <Field id="ref" label="Referencia o motivo">
                <input id="ref" className={inputCls} placeholder={tipo === "SALIDA_ORDEN" ? "Código OT (ej. OT-2026-0001)" : "Motivo del ajuste"} value={refMotivo} onChange={(e) => setRefMotivo(e.target.value)} required />
              </Field>
            )}
            <Button>Registrar</Button>
          </form>
        </Card>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {repuestos.map((r) => (
          <li key={r.id}>
            <Card>
              <p className="text-sm">
                <strong>{r.sku}</strong> {r.nombre} — stock {r.stock}
                {r.stock <= r.stockMinimo && (
                  <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">¡Stock mínimo!</span>
                )}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </Page>
  );
}
