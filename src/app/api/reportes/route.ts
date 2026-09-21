import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireRole } from "@/lib/require-role";

const prisma = new PrismaClient();

function dia(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** GET /api/reportes?desde=YYYY-MM-DD&hasta=YYYY-MM-DD (defecto: últimos 30 días). */
export async function GET(req: NextRequest) {
  requireRole(["admin", "recepcion"]);
  const hoy = new Date();
  const porDefecto = new Date(hoy.getTime() - 29 * 86400_000).toISOString().slice(0, 10);
  const desde = req.nextUrl.searchParams.get("desde") ?? porDefecto;
  const hasta = req.nextUrl.searchParams.get("hasta") ?? hoy.toISOString().slice(0, 10);
  try {
    const lista = await prisma.cobro.findMany({
      where: { creadoEn: { gte: new Date(desde), lt: new Date(hasta + "T23:59:59.999Z") } },
      include: { lineas: true },
      orderBy: { creadoEn: "asc" }
    });

    const porDia: Record<string, { ves: number; usd: number; n: number }> = {};
    const porMetodo: Record<string, number> = {};
    let totalVES = 0;
    for (const c of lista) {
      const d = dia(c.creadoEn);
      porDia[d] ??= { ves: 0, usd: 0, n: 0 };
      porDia[d].ves += Number(c.totalVES);
      porDia[d].usd += Number(c.totalUSDRef);
      porDia[d].n += 1;
      totalVES += Number(c.totalVES);
      for (const l of c.lineas) {
        porMetodo[l.metodo] = (porMetodo[l.metodo] ?? 0) + Number(l.monto);
      }
    }

    // Cuentas por cobrar: presupuestos con saldo > 0 en órdenes no canceladas/entregadas.
    // (Cobro.ordenId no tiene FK: se cruza en código.)
    const pendientes = await prisma.orden.findMany({
      where: { estado: { notIn: ["CANCELADA", "ENTREGADA"] }, presupuesto: { isNot: null } },
      include: {
        presupuesto: true,
        equipo: { include: { cliente: true } }
      },
      take: 100
    });
    const sumas = await prisma.cobro.groupBy({
      by: ["ordenId"],
      _sum: { totalVES: true }
    });
    const cobradoPor = new Map(sumas.map((s) => [s.ordenId, Number(s._sum.totalVES ?? 0)]));
    const porCobrar = pendientes
      .map((o) => {
        const total = Number(o.presupuesto!.totalVES);
        const cobrado = cobradoPor.get(o.id) ?? 0;
        return {
          codigo: o.codigo,
          cliente: o.equipo.cliente.nombre,
          estado: o.estado,
          totalVES: total,
          cobradoVES: cobrado,
          saldoVES: total - cobrado
        };
      })
      .filter((x) => x.saldoVES > 0);

    const ticketPromedio = lista.length > 0 ? totalVES / lista.length : 0;

    return NextResponse.json({
      ok: true,
      desde,
      hasta,
      ingresos: { totalVES, cobros: lista.length, ticketPromedioVES: ticketPromedio },
      porDia,
      porMetodo,
      cuentasPorCobrar: porCobrar,
      totalPorCobrarVES: porCobrar.reduce((acc, x) => acc + x.saldoVES, 0)
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
