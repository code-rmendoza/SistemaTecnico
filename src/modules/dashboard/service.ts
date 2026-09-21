import { PrismaClient } from "@prisma/client";
import { hoyVE } from "@/lib/fecha";

const prisma = new PrismaClient();

export type DashboardStats = {
  totalOrdenes: number;
  ordenesPorEstado: { estado: string; count: number }[];
  ingresosHoy: number;
  ticketsPendientes: number;
  itemsBajoStock: number;
  ordenesUltimos7Dias: { fecha: string; count: number }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const hoy = hoyVE();
  const hace7Dias = new Date(Date.now() - 7 * 24 * 3600_000);

  const [
    totalOrdenes,
    ordenesPorEstado,
    ingresosHoy,
    ticketsPendientes,
    itemsBajoStock,
    ordenesUltimos7Dias
  ] = await Promise.all([
    prisma.orden.count(),

    prisma.orden.groupBy({
      by: ["estado"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),

    prisma.cobroLinea.aggregate({
      _sum: { monto: true },
      where: {
        cobro: {
          creadoEn: {
            gte: new Date(hoy + "T04:00:00Z"),
            lt: new Date(new Date(hoy + "T04:00:00Z").getTime() + 86400_000),
          },
        },
      },
    }),

    prisma.orden.count({
      where: {
        estado: {
          notIn: ["ENTREGADA", "CANCELADA"],
        },
      },
    }),

    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::int AS count
      FROM "Repuesto"
      WHERE "stock" <= "stockMinimo"
    `,

    prisma.$queryRaw<{ fecha: string; count: bigint }[]>`
      SELECT DATE(c."creadoEn" AT TIME ZONE 'America/Caracas')::text AS fecha, COUNT(*)::int AS count
      FROM "Orden" c
      WHERE c."creadoEn" >= ${hace7Dias}
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  return {
    totalOrdenes,
    ordenesPorEstado: ordenesPorEstado.map((e) => ({
      estado: e.estado,
      count: e._count.id,
    })),
    ingresosHoy: Number(ingresosHoy._sum.monto ?? 0),
    ticketsPendientes,
    itemsBajoStock: Number(itemsBajoStock[0]?.count ?? 0),
    ordenesUltimos7Dias: ordenesUltimos7Dias.map((r) => ({
      fecha: r.fecha,
      count: Number(r.count),
    })),
  };
}
