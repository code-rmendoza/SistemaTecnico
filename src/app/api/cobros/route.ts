import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/require-role";
import { CobroLinea } from "@/modules/billing/schemas";
import { imputarCobro } from "@/modules/billing/cobros";
import { hoyVE } from "@/lib/fecha";

const prisma = new PrismaClient();

const CobroInput = z.object({
  ordenId: z.string().min(1),
  lineas: z.array(CobroLinea).min(1),
  tasaCobro: z.number().positive().optional()
});

export async function POST(req: NextRequest) {
  const actor = requireRole(["admin", "recepcion"]);
  const body = CobroInput.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Cobro inválido" }, { status: 400 });
  }
  try {
    const orden = await prisma.orden.findUnique({
      where: { id: body.data.ordenId },
      include: { presupuesto: true }
    });
    if (!orden?.presupuesto) {
      return NextResponse.json({ error: "La orden no tiene presupuesto" }, { status: 422 });
    }
    const cobrados = await prisma.cobro.aggregate({
      where: { ordenId: body.data.ordenId },
      _sum: { totalVES: true }
    });
    const total = Number(orden.presupuesto.totalVES);
    const saldo = total - Number(cobrados._sum.totalVES ?? 0);
    if (saldo <= 0) {
      return NextResponse.json({ error: "La orden ya está pagada" }, { status: 422 });
    }
    let tasa = body.data.tasaCobro;
    if (!tasa) {
      // $queryRaw en vez del cliente tipado: evita un paradox de tipos del
      // generated client con Decimal en este proyecto (ver tsc 2026-09-21).
      const rows = await prisma.$queryRaw<{ valor: unknown }[]>`
        SELECT "valorVESporUSD" AS valor FROM "TasaCambio" ORDER BY fecha DESC LIMIT 1`;
      if (rows.length === 0) {
        return NextResponse.json({ error: "Sin tasa del día: cobro bloqueado" }, { status: 422 });
      }
      tasa = Number(rows[0].valor);
    }
    let imputado;
    try {
      imputado = imputarCobro({ totalVES: saldo, tasaCobro: tasa, lineas: body.data.lineas });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Cobro inválido" },
        { status: 422 }
      );
    }
    const fecha = new Date(hoyVE());
    const porMoneda: Record<string, number> = {};
    for (const l of body.data.lineas) {
      porMoneda[l.moneda] = (porMoneda[l.moneda] ?? 0) + l.monto;
    }
    const cubierto = imputado.entregadoVES - imputado.vueltoVES;
    const resultado = await prisma.$transaction(async (tx) => {
      const cobro = await tx.cobro.create({
        data: {
          ordenId: body.data.ordenId,
          usuario: actor.sub,
          tasaCobro: tasa as number,
          totalVES: cubierto,
          totalUSDRef: cubierto / (tasa as number),
          vueltoVES: imputado.vueltoVES,
          lineas: {
            create: body.data.lineas.map((l) => ({
              metodo: l.metodo,
              moneda: l.moneda,
              monto: l.monto
            }))
          }
        },
        include: { lineas: true }
      });
      for (const moneda of Object.keys(porMoneda)) {
        const monto = porMoneda[moneda];
        await tx.movimientoCaja.create({
          data: {
            fecha,
            usuario: actor.sub,
            moneda,
            monto,
            concepto: `Cobro ${orden.codigo}`,
            cobroId: cobro.id
          }
        });
      }
      if (imputado.vueltoVES > 0) {
        await tx.movimientoCaja.create({
          data: {
            fecha,
            usuario: actor.sub,
            moneda: "VES",
            monto: -imputado.vueltoVES,
            concepto: `Vuelto ${orden.codigo}`,
            cobroId: cobro.id
          }
        });
      }
      return cobro;
    });
    return NextResponse.json({ ok: true, cobro: resultado, vueltoVES: imputado.vueltoVES }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
