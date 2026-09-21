"use client";

import { useEffect, useState } from "react";

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

  if (!rep) return <main className="p-6"><p>Cargando…</p></main>;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold">Reportes (últimos 30 días)</h1>

      <section className="mt-3 rounded border p-3 text-sm">
        <p><strong>Ingresos:</strong> {rep.ingresos.totalVES} Bs en {rep.ingresos.cobros} cobros</p>
        <p><strong>Ticket promedio:</strong> {rep.ingresos.ticketPromedioVES.toFixed(2)} Bs</p>
        <p><strong>Por cobrar:</strong> {rep.totalPorCobrarVES} Bs ({rep.cuentasPorCobrar.length} órdenes)</p>
      </section>

      <section className="mt-3 rounded border p-3 text-sm">
        <h2 className="font-bold">Por día</h2>
        <ul>
          {Object.entries(rep.porDia).map(([d, v]) => (
            <li key={d}>{d}: {v.ves} Bs ({v.n} cobros)</li>
          ))}
        </ul>
        {Object.keys(rep.porDia).length === 0 && <p className="opacity-60">Sin cobros en el período.</p>}
      </section>

      <section className="mt-3 rounded border p-3 text-sm">
        <h2 className="font-bold">Por método</h2>
        <ul>
          {Object.entries(rep.porMetodo).map(([m, v]) => (
            <li key={m}>{m}: {v}</li>
          ))}
        </ul>
      </section>

      <section className="mt-3 rounded border p-3 text-sm">
        <h2 className="font-bold">Cuentas por cobrar</h2>
        <ul className="divide-y">
          {rep.cuentasPorCobrar.map((c) => (
            <li key={c.codigo} className="py-1">
              <strong>{c.codigo}</strong> {c.cliente} — saldo {c.saldoVES} Bs ({c.cobradoVES}/{c.totalVES})
            </li>
          ))}
        </ul>
        {rep.cuentasPorCobrar.length === 0 && <p className="opacity-60">Nada pendiente. 🎉</p>}
      </section>
    </main>
  );
}
