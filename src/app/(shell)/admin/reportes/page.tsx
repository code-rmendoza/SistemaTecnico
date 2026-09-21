"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Card, EmptyState, Field, Page, PageHeader, inputCls } from "@/components/ui";
import { useToast } from "@/components/toast";

interface Reporte {
  desde: string;
  hasta: string;
  ingresos: { totalVES: number; cobros: number; ticketPromedioVES: number };
  porDia: Record<string, { ves: number; usd: number; n: number }>;
  porMetodo: Record<string, number>;
  cuentasPorCobrar: { codigo: string; cliente: string; estado: string; totalVES: number; cobradoVES: number; saldoVES: number }[];
  totalPorCobrarVES: number;
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function hace30(): string {
  return new Date(Date.now() - 29 * 86400_000).toISOString().slice(0, 10);
}

function exportCSV(nombre: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportesPage() {
  const { toast } = useToast();
  const [rep, setRep] = useState<Reporte | null>(null);
  const [desde, setDesde] = useState(hace30);
  const [hasta, setHasta] = useState(hoy);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const res = await fetch(`/api/reportes?desde=${desde}&hasta=${hasta}`);
    if (res.ok) setRep(await res.json());
    setCargando(false);
  }, [desde, hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function exportarCobros() {
    if (!rep) return;
    const rows = [["Fecha", "Monto VES", "Monto USD", "Cobros"]];
    for (const [d, v] of Object.entries(rep.porDia)) {
      rows.push([d, String(v.ves), String(v.usd), String(v.n)]);
    }
    exportCSV(`cobros_${desde}_${hasta}.csv`, rows);
    toast("CSV de cobros descargado", "success");
  }

  function exportarPorCobrar() {
    if (!rep) return;
    const rows = [["Código", "Cliente", "Estado", "Total VES", "Cobrado VES", "Saldo VES"]];
    for (const c of rep.cuentasPorCobrar) {
      rows.push([c.codigo, c.cliente, c.estado, String(c.totalVES), String(c.cobradoVES), String(c.saldoVES)]);
    }
    exportCSV(`por_cobrar_${desde}_${hasta}.csv`, rows);
    toast("CSV de cuentas por cobrar descargado", "success");
  }

  function exportarMetodos() {
    if (!rep) return;
    const rows = [["Método", "Monto"]];
    for (const [m, v] of Object.entries(rep.porMetodo)) {
      rows.push([m, String(v)]);
    }
    exportCSV(`metodos_${desde}_${hasta}.csv`, rows);
    toast("CSV de métodos descargado", "success");
  }

  return (
    <Page wide>
      <PageHeader title="Reportes" sub="Consulta por rango de fechas" />

      {/* Filtros */}
      <Card>
        <form
          onSubmit={(e) => { e.preventDefault(); cargar(); }}
          className="flex flex-col sm:flex-row items-end gap-3"
        >
          <Field id="desde" label="Desde">
            <input id="desde" type="date" className={inputCls} value={desde} onChange={(e) => setDesde(e.target.value)} max={hasta} />
          </Field>
          <Field id="hasta" label="Hasta">
            <input id="hasta" type="date" className={inputCls} value={hasta} onChange={(e) => setHasta(e.target.value)} min={desde} max={hoy()} />
          </Field>
          <Button type="submit" disabled={cargando}>
            {cargando ? "Cargando…" : "Consultar"}
          </Button>
        </form>
      </Card>

      {!rep ? (
        <div className="mt-4 space-y-3">
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Card>
              <p className="text-xs text-slate-500">Ingresos</p>
              <p className="text-xl font-bold text-slate-900">{rep.ingresos.totalVES.toLocaleString("es-VE")} Bs</p>
              <p className="text-sm text-slate-500">{rep.ingresos.cobros} cobros</p>
            </Card>
            <Card>
              <p className="text-xs text-slate-500">Ticket promedio</p>
              <p className="text-xl font-bold text-slate-900">{rep.ingresos.ticketPromedioVES.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs</p>
            </Card>
            <Card>
              <p className="text-xs text-slate-500">Por cobrar</p>
              <p className="text-xl font-bold text-amber-600">{rep.totalPorCobrarVES.toLocaleString("es-VE")} Bs</p>
              <p className="text-sm text-slate-500">{rep.cuentasPorCobrar.length} órdenes</p>
            </Card>
          </div>

          {/* Por día + Por método */}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-slate-900">Por día</h2>
                <Button variant="ghost" onClick={exportarCobros} className="text-xs px-2 py-1">
                  <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  CSV
                </Button>
              </div>
              {Object.keys(rep.porDia).length === 0 ? (
                <p className="text-sm text-slate-500">Sin cobros en el período.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="pb-1">Fecha</th>
                        <th className="pb-1 text-right">Cobros</th>
                        <th className="pb-1 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(rep.porDia).map(([d, v]) => (
                        <tr key={d}>
                          <td className="py-1 font-medium text-slate-900">{d}</td>
                          <td className="py-1 text-right text-slate-600">{v.n}</td>
                          <td className="py-1 text-right text-slate-600">{v.ves.toLocaleString("es-VE")} Bs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-slate-900">Por método</h2>
                <Button variant="ghost" onClick={exportarMetodos} className="text-xs px-2 py-1">
                  <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  CSV
                </Button>
              </div>
              <ul className="text-sm space-y-1">
                {Object.entries(rep.porMetodo).map(([m, v]) => (
                  <li key={m} className="flex items-center justify-between">
                    <span className="text-slate-700">{m}</span>
                    <span className="font-medium text-slate-900">{v.toLocaleString("es-VE")}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Cuentas por cobrar */}
          <Card className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">Cuentas por cobrar</h2>
              {rep.cuentasPorCobrar.length > 0 && (
                <Button variant="ghost" onClick={exportarPorCobrar} className="text-xs px-2 py-1">
                  <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  CSV
                </Button>
              )}
            </div>
            {rep.cuentasPorCobrar.length === 0 ? (
              <EmptyState>Nada pendiente en este período.</EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="pb-2">Código</th>
                      <th className="pb-2">Cliente</th>
                      <th className="pb-2">Estado</th>
                      <th className="pb-2 text-right">Total</th>
                      <th className="pb-2 text-right">Cobrado</th>
                      <th className="pb-2 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rep.cuentasPorCobrar.map((c) => (
                      <tr key={c.codigo}>
                        <td className="py-2 font-medium text-slate-900">{c.codigo}</td>
                        <td className="py-2 text-slate-600">{c.cliente}</td>
                        <td className="py-2 text-slate-600">{c.estado.replace(/_/g, " ")}</td>
                        <td className="py-2 text-right text-slate-600">{c.totalVES.toLocaleString("es-VE")}</td>
                        <td className="py-2 text-right text-slate-600">{c.cobradoVES.toLocaleString("es-VE")}</td>
                        <td className="py-2 text-right font-medium text-amber-600">{c.saldoVES.toLocaleString("es-VE")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </Page>
  );
}
