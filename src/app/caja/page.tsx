"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Field, Notice, Page, PageHeader, inputCls } from "@/components/ui";

interface OrdenCobro {
  id: string;
  codigo: string;
}

const METODOS = ["EFECTIVO_VES", "EFECTIVO_USD", "PAGO_MOVIL", "TRANSFERENCIA_VES", "TRANSFERENCIA_USD", "TARJETA"];

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

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <h2 className="mb-2 text-sm font-bold">Tasa del día{tasaValor !== null ? `: ${tasaValor} Bs/USD` : " (sin fijar)"}</h2>
          <form onSubmit={guardarTasa} className="flex flex-col gap-2">
            <Field id="tasa" label="Nueva tasa (solo admin)">
              <input id="tasa" className={inputCls} value={nuevaTasa} onChange={(e) => setNuevaTasa(e.target.value)} placeholder="Bs por USD" inputMode="decimal" />
            </Field>
            <Button>Fijar (admin)</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-2 text-sm font-bold">Cobrar orden</h2>
          <form onSubmit={buscarOrden} className="flex gap-2">
            <Field id="cod" label="Código OT">
              <input id="cod" className={inputCls} value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="OT-2026-0001" />
            </Field>
            <Button variant="outline" className="self-end">Buscar</Button>
          </form>
          {orden && (
            <form onSubmit={cobrar} className="mt-2 flex flex-col gap-2">
              <p className="text-sm"><strong>{orden.codigo}</strong> — saldo {orden.saldoVES} Bs</p>
              <div className="grid grid-cols-2 gap-2">
                <Field id="met" label="Método">
                  <select id="met" className={inputCls} value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                    {METODOS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </Field>
                <Field id="monto" label="Monto">
                  <input id="monto" className={inputCls} value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Monto" inputMode="decimal" required />
                </Field>
              </div>
              <Button>Cobrar</Button>
            </form>
          )}
        </Card>

        <Card>
          <h2 className="mb-2 text-sm font-bold">Cierre del día</h2>
          <form onSubmit={cerrar} className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Field id="cves" label="Contado Bs">
                <input id="cves" className={inputCls} value={contadoVES} onChange={(e) => setContadoVES(e.target.value)} placeholder="Contado Bs" inputMode="decimal" required />
              </Field>
              <Field id="cusd" label="Contado USD">
                <input id="cusd" className={inputCls} value={contadoUSD} onChange={(e) => setContadoUSD(e.target.value)} placeholder="Contado USD" inputMode="decimal" required />
              </Field>
            </div>
            <Button>Cerrar</Button>
          </form>
          {cierre && <p className="mt-2 text-sm">Diferencia: {cierre.diferenciaVES} Bs, {cierre.diferenciaUSD} USD</p>}
        </Card>
      </div>
    </Page>
  );
}
