"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, EstadoBadge, Field, Page, inputCls } from "@/components/ui";

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

  if (error && !orden)
    return (
      <Page>
        <Alert>{error}</Alert>
      </Page>
    );
  if (!orden)
    return (
      <Page>
        <p className="text-sm text-stone-500">Cargando…</p>
      </Page>
    );

  return (
    <Page wide>
      <a className="text-sm text-emerald-700 underline" href="/ordenes">← Órdenes</a>
      <h1 className="mt-2 text-xl font-bold tracking-tight">
        {orden.codigo} <EstadoBadge estado={orden.estado} />
      </h1>
      <p className="text-sm text-stone-500">{orden.fallaDeclarada} · Prioridad {orden.prioridad}</p>
      {error && <Alert>{error}</Alert>}

      <div className="mt-3 flex flex-wrap gap-2">
        {(SIGUIENTES[orden.estado] ?? []).map((s) => (
          <Button key={s} variant="outline" onClick={() => transicionar(s)}>
            → {s}
          </Button>
        ))}
      </div>

      <Card className="mt-4">
        <h2 className="mb-2 text-sm font-bold">Presupuesto</h2>
        {orden.presupuesto ? (
          <div className="text-sm">
            <p>Mano de obra: {String(orden.presupuesto.manoObraUSD)} USD · Tasa {String(orden.presupuesto.tasaRef)}</p>
            {(orden.presupuesto.items ?? []).length > 0 && (
              <ul className="list-disc pl-5 text-stone-600">
                {(orden.presupuesto.items ?? []).map((r, i) => (
                  <li key={i}>{r.cantidad}× {r.sku} @ {String(r.precioUSD)} USD</li>
                ))}
              </ul>
            )}
            <p className="mt-1"><strong>Total: {String(orden.presupuesto.totalUSDRef)} USD = {String(orden.presupuesto.totalVES)} Bs</strong></p>
            <p className="text-stone-500">Estado: {orden.presupuesto.aprobada ? "APROBADO" : "pendiente de aprobación"}</p>
            {!orden.presupuesto.aprobada && orden.estado === "PRESUPUESTADA" && (
              <Button className="mt-2" onClick={aprobar}>Aprobar</Button>
            )}
          </div>
        ) : (
          <form onSubmit={presupuestar} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Field id="mo" label="Mano de obra USD">
                <input id="mo" className={inputCls} value={manoObra} onChange={(e) => setManoObra(e.target.value)} placeholder="Mano obra USD" inputMode="decimal" />
              </Field>
              <Field id="tasa" label="Tasa">
                <input id="tasa" className={inputCls} value={tasa} onChange={(e) => setTasa(e.target.value)} placeholder="Tasa" inputMode="decimal" />
              </Field>
            </div>
            <div className="flex items-end gap-2">
              <Field id="sku" label="SKU repuesto">
                <input id="sku" className={inputCls} value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" />
              </Field>
              <Field id="cant" label="Cant">
                <input id="cant" className={inputCls} value={cant} onChange={(e) => setCant(e.target.value)} placeholder="Cant" inputMode="numeric" />
              </Field>
              <Field id="precio" label="Precio USD">
                <input id="precio" className={inputCls} value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="USD" inputMode="decimal" />
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
              >
                +
              </Button>
            </div>
            {repuestos.length > 0 && (
              <ul className="text-sm text-stone-600">
                {repuestos.map((r, i) => (
                  <li key={i}>{r.cantidad}× {r.sku} @ {r.precioUSD} USD</li>
                ))}
              </ul>
            )}
            <Button>Presupuestar</Button>
          </form>
        )}
      </Card>

      <Card className="mt-4">
        <h2 className="mb-2 text-sm font-bold">Historial</h2>
        {orden.historial.length === 0 ? (
          <p className="text-sm text-stone-500">Sin movimientos.</p>
        ) : (
          <ol className="list-disc pl-5 text-sm">
            {orden.historial.map((h, i) => (
              <li key={i}>{h.de} → {h.a} · {h.usuario} · {String(h.fecha).slice(0, 16).replace("T", " ")}</li>
            ))}
          </ol>
        )}
      </Card>
    </Page>
  );
}
