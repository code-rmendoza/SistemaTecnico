import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { getDashboardStats } from "@/modules/dashboard/service";
import { Card } from "@/components/ui";
import { cn } from "@/components/cn";

const STATUS_COLORS: Record<string, string> = {
  INGRESADA: "bg-slate-100 text-slate-700",
  DIAGNOSTICO: "bg-amber-100 text-amber-800",
  PRESUPUESTADA: "bg-sky-100 text-sky-800",
  APROBADA: "bg-indigo-100 text-indigo-800",
  EN_REPARACION: "bg-orange-100 text-orange-800",
  CONTROL_CALIDAD: "bg-yellow-100 text-yellow-800",
  LISTA_ENTREGA: "bg-teal-100 text-teal-800",
  ENTREGADA: "bg-emerald-100 text-emerald-800",
  CANCELADA: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  INGRESADA: "Ingresada",
  DIAGNOSTICO: "Diagnóstico",
  PRESUPUESTADA: "Presupuestada",
  APROBADA: "Aprobada",
  EN_REPARACION: "En reparación",
  CONTROL_CALIDAD: "Control calidad",
  LISTA_ENTREGA: "Lista entrega",
  ENTREGADA: "Entregada",
  CANCELADA: "Cancelada",
};

const PIPELINE_ORDER = [
  "INGRESADA",
  "DIAGNOSTICO",
  "PRESUPUESTADA",
  "APROBADA",
  "EN_REPARACION",
  "CONTROL_CALIDAD",
  "LISTA_ENTREGA",
  "ENTREGADA",
];

function formatUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function Home() {
  const token = cookies().get("session")?.value;
  let valido = false;
  if (token) {
    try {
      verifySession(token, process.env.JWT_SECRET ?? "dev-secret-solo-local");
      valido = true;
    } catch {
      valido = false;
    }
  }
  if (!valido) redirect("/login");

  const stats = await getDashboardStats();

  const estadoMap = new Map(stats.ordenesPorEstado.map((e) => [e.estado, e.count]));
  const maxCount = Math.max(...stats.ordenesPorEstado.map((e) => e.count), 1);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Resumen del taller · {new Date().toLocaleDateString("es-VE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Órdenes totales"
          value={stats.totalOrdenes.toString()}
          icon={<IconClipboard className="h-5 w-5 text-emerald-600" />}
          accent="emerald"
        />
        <KpiCard
          label="Tickets activos"
          value={stats.ticketsPendientes.toString()}
          icon={<IconClock className="h-5 w-5 text-amber-600" />}
          accent="amber"
        />
        <KpiCard
          label="Ingresos hoy"
          value={formatUSD(stats.ingresosHoy)}
          icon={<IconDollar className="h-5 w-5 text-sky-600" />}
          accent="sky"
        />
        <KpiCard
          label="Bajo stock"
          value={stats.itemsBajoStock.toString()}
          icon={<IconAlert className="h-5 w-5 text-red-600" />}
          accent="red"
        />
      </div>

      {/* Pipeline + Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline */}
        <Card className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Pipeline de Órdenes</h2>
          <div className="space-y-3">
            {PIPELINE_ORDER.map((estado) => {
              const count = estadoMap.get(estado) ?? 0;
              const pct = (count / maxCount) * 100;
              return (
                <div key={estado} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600 w-28 shrink-0 truncate">{STATUS_LABELS[estado]}</span>
                  <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className={cn("h-full rounded-lg transition-all duration-500 flex items-center px-2.5", STATUS_COLORS[estado])}
                      style={{ width: `${Math.max(pct, count > 0 ? 12 : 0)}%` }}
                    >
                      {count > 0 && <span className="text-xs font-bold">{count}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Weekly chart */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Últimos 7 días</h2>
          <div className="flex items-end gap-2 h-40">
            {stats.ordenesUltimos7Dias.map((d) => {
              const maxD = Math.max(...stats.ordenesUltimos7Dias.map((x) => x.count), 1);
              const h = (d.count / maxD) * 100;
              return (
                <div key={d.fecha} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-slate-700">{d.count}</span>
                  <div className="w-full bg-emerald-500 rounded-t-md transition-all duration-300" style={{ height: `${Math.max(h, 4)}%` }} />
                  <span className="text-[10px] text-slate-400">{new Date(d.fecha + "T12:00:00").toLocaleDateString("es-VE", { weekday: "short" })}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickLink href="/ordenes" label="Nueva orden" icon={<IconPlus className="h-4 w-4" />} />
          <QuickLink href="/clientes" label="Buscar cliente" icon={<IconSearch className="h-4 w-4" />} />
          <QuickLink href="/caja" label="Cobrar" icon={<IconWallet className="h-4 w-4" />} />
          <QuickLink href="/inventario" label="Inventario" icon={<IconPackage className="h-4 w-4" />} />
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────── */

function KpiCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm"
    >
      {icon}
      {label}
    </a>
  );
}

/* ── Icons ────────────────────────────────────────── */

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
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

function IconDollar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function IconWallet({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
    </svg>
  );
}

function IconPackage({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  );
}
