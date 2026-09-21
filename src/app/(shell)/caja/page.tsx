"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Field, Notice, Page, PageHeader, inputCls } from "@/components/ui";
import { cn } from "@/components/cn";

interface OrdenCobro {
  id: string;
  codigo: string;
}

const METODOS: { value: string; label: string; moneda: string }[] = [
  { value: "EFECTIVO_VES", label: "Efectivo Bs.", moneda: "VES" },
  { value: "EFECTIVO_USD", label: "Efectivo $", moneda: "USD" },
  { value: "PAGO_MOVIL", label: "Pago móvil", moneda: "VES" },
  { value: "TRANSFERENCIA_VES", label: "Transferencia Bs.", moneda: "VES" },
  { value: "TRANSFERENCIA_USD", label: "Transferencia $", moneda: "USD" },
  { value: "TARJETA", label: "Tarjeta", moneda: "VES" },
];

export default function CajaPage() {
  const [tasaValor, setTasaValor] = useState<number | null>(null);
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
      if (d.tasa) setTasaValor(Number(d.tasa.valorVESPorUSD));
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
      body: JSON.stringify({ valorVESPorUSD: Number(nuevaTasa) })
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
    const moneda = METODOS.find((m) => m.value === metodo)?.moneda ?? "VES";
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
    if (tasaValor === null) {
      setError("Sin tasa del día");
      return;
    }
    const res = await fetch("/api/caja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contadoVES: Number(contadoVES),
        contadoUSD: Number(contadoUSD),
        tasaCierre: tasaValor
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
    <Page wide>
      <PageHeader title="Caja" sub={resumen ? `Esperado hoy: ${resumen.esperadoVES} Bs + ${resumen.esperadoUSD} USD` : undefined} />
      {error && <Alert>{error}</Alert>}
      {msg && <Notice>{msg}</Notice>}

      <div className="grid gap-4 md:grid-cols-3">
        {/* Tasa */}
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
              <svg className="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Tasa del día</h2>
              <p className="text-xs text-slate-500">{tasaValor !== null ? `${tasaValor} Bs/USD` : "Sin fijar"}</p>
            </div>
          </div>
          <form onSubmit={guardarTasa} className="flex flex-col gap-3">
            <Field id="tasa" label="Nueva tasa (admin)">
              <input id="tasa" className={inputCls} value={nuevaTasa} onChange={(e) => setNuevaTasa(e.target.value)} placeholder="Ej: 42.50" inputMode="decimal" />
            </Field>
            <Button>Fijar tasa</Button>
          </form>
        </Card>

        {/* Cobrar */}
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Cobrar orden</h2>
              <p className="text-xs text-slate-500">Buscar por código OT</p>
            </div>
          </div>
          <form onSubmit={buscarOrden} className="flex gap-2">
            <Field id="cod" label="Código">
              <input id="cod" className={inputCls} value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="OT-2026-0001" />
            </Field>
            <Button variant="outline" className="self-end">Buscar</Button>
          </form>
          {orden && (
            <form onSubmit={cobrar} className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3">
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-500">Saldo a cobrar</p>
                <p className="text-xl font-bold text-slate-900">{orden.saldoVES} Bs</p>
                <p className="text-xs font-medium text-slate-600">{orden.codigo}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field id="met" label="Método">
                  <select id="met" className={inputCls} value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                    {METODOS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </Field>
                <Field id="monto" label="Monto">
                  <input id="monto" className={inputCls} value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" inputMode="decimal" required />
                </Field>
              </div>
              <Button>Cobrar</Button>
            </form>
          )}
        </Card>

        {/* Cierre */}
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Cierre del día</h2>
              <p className="text-xs text-slate-500">Contar efectivo y cerrar</p>
            </div>
          </div>
          <form onSubmit={cerrar} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field id="cves" label="Contado Bs.">
                <input id="cves" className={inputCls} value={contadoVES} onChange={(e) => setContadoVES(e.target.value)} placeholder="0.00" inputMode="decimal" required />
              </Field>
              <Field id="cusd" label="Contado USD">
                <input id="cusd" className={inputCls} value={contadoUSD} onChange={(e) => setContadoUSD(e.target.value)} placeholder="0.00" inputMode="decimal" required />
              </Field>
            </div>
            <Button>Cerrar caja</Button>
          </form>
          {cierre && (
            <div className={cn(
              "mt-3 rounded-lg p-3 text-sm text-center",
              cierre.diferenciaVES === 0 && cierre.diferenciaUSD === 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            )}>
              <p className="font-semibold">
                {cierre.diferenciaVES === 0 && cierre.diferenciaUSD === 0
                  ? "✓ Cuadra perfecto"
                  : `Diferencia: ${cierre.diferenciaVES} Bs, ${cierre.diferenciaUSD} USD`}
              </p>
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
