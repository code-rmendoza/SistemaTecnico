"use client";

import { useEffect, useState } from "react";
import { Card, EmptyState, Page, PageHeader } from "@/components/ui";

interface Reporte {
  ingresos: { totalVES: number; cobros: number; ticketPromedioVES: number };
  porDia: Record<string, { ves: number; usd: number; n: number }>;
  porMetodo: Record<string, number>;
  cuentasPorCobrar: { codigo: string; cliente: string; estado: string; totalVES: number; cobradoVES: number; saldoVES: number }[];
  totalPorCobrarVES: number;
}

export default function ReportesPage() {
  const [rep, setRep] = useState<Reporte | null>(null);

  useEffect(() => {
    fetch("/api/reportes").then(async (r) => {
      if (r.ok) setRep(await r.json());
    });
  }, []);

  if (!rep)
    return (
      <Page>
        <p className="text-sm text-stone-500">Cargando…</p>
      </Page>
    );

  return (
    <Page wide>
      <PageHeader title="Reportes" sub="Últimos 30 días" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-stone-500">Ingresos</p>
          <p className="text-xl font-bold">{rep.ingresos.totalVES} Bs</p>
          <p className="text-sm text-stone-500">{rep.ingresos.cobros} cobros</p>
        </Card>
        <Card>
          <p className="text-xs text-stone-500">Ticket promedio</p>
          <p className="text-xl font-bold">{rep.ingresos.ticketPromedioVES.toFixed(2)} Bs</p>
        </Card>
        <Card>
          <p className="text-xs text-stone-500">Por cobrar</p>
          <p className="text-xl font-bold">{rep.totalPorCobrarVES} Bs</p>
          <p className="text-sm text-stone-500">{rep.cuentasPorCobrar.length} órdenes</p>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-bold">Por día</h2>
          {Object.keys(rep.porDia).length === 0 ? (
            <p className="text-sm text-stone-500">Sin cobros en el período.</p>
          ) : (
            <ul className="text-sm">
              {Object.entries(rep.porDia).map(([d, v]) => (
                <li key={d}>{d}: {v.ves} Bs ({v.n} cobros)</li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-2 text-sm font-bold">Por método</h2>
          <ul className="text-sm">
            {Object.entries(rep.porMetodo).map(([m, v]) => (
              <li key={m}>{m}: {v}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-3">
        <h2 className="mb-2 text-sm font-bold">Cuentas por cobrar</h2>
        {rep.cuentasPorCobrar.length === 0 ? (
          <EmptyState>Nada pendiente. 🎉</EmptyState>
        ) : (
          <ul className="divide-y divide-stone-100 text-sm">
            {rep.cuentasPorCobrar.map((c) => (
              <li key={c.codigo} className="py-1">
                <strong>{c.codigo}</strong> {c.cliente} — saldo {c.saldoVES} Bs ({c.cobradoVES}/{c.totalVES})
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}
