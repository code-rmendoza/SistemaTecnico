import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/require-role";
import { hoyVE } from "@/lib/fecha";

const prisma = new PrismaClient();

/** Resumen del día: movimientos + esperado por moneda + cierre si existe. */
export async function GET(req: NextRequest) {
  requireRole(["admin", "recepcion"]);
  const fecha = req.nextUrl.searchParams.get("fecha") ?? hoyVE();
  try {
    const movimientos = await prisma.movimientoCaja.findMany({
      where: { fecha: new Date(fecha) },
      orderBy: { creadoEn: "asc" }
    });
    const esperadoVES = movimientos
      .filter((m) => m.moneda === "VES")
      .reduce((acc, m) => acc + Number(m.monto), 0);
    const esperadoUSD = movimientos
      .filter((m) => m.moneda === "USD")
      .reduce((acc, m) => acc + Number(m.monto), 0);
    const cierre = await prisma.cajaDiaria.findFirst({ where: { fecha: new Date(fecha) } });
    return NextResponse.json({ ok: true, fecha, movimientos, esperadoVES, esperadoUSD, cierre });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}

const CierreInput = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  contadoVES: z.number().min(0),
  contadoUSD: z.number().min(0),
  tasaCierre: z.number().positive()
});

export async function POST(req: NextRequest) {
  const actor = requireRole(["admin", "recepcion"]);
  const body = CierreInput.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Cierre inválido" }, { status: 400 });
  }
  try {
    const fecha = new Date(body.data.fecha ?? hoyVE());
    const movimientos = await prisma.movimientoCaja.findMany({ where: { fecha } });
    const esperadoVES = movimientos
      .filter((m) => m.moneda === "VES")
      .reduce((acc, m) => acc + Number(m.monto), 0);
    const esperadoUSD = movimientos
      .filter((m) => m.moneda === "USD")
      .reduce((acc, m) => acc + Number(m.monto), 0);
    const cierre = await prisma.cajaDiaria.upsert({
      where: { id: `${fecha.toISOString().slice(0, 10)}-${actor.sub}` },
      update: {
        tasaCierre: body.data.tasaCierre,
        esperadoVES,
        esperadoUSD,
        contadoVES: body.data.contadoVES,
        contadoUSD: body.data.contadoUSD,
        cerradaEn: new Date()
      },
      create: {
        id: `${fecha.toISOString().slice(0, 10)}-${actor.sub}`,
        fecha,
        usuarioId: actor.sub,
        tasaCierre: body.data.tasaCierre,
        inicialVES: 0,
        inicialUSD: 0,
        esperadoVES,
        esperadoUSD,
        contadoVES: body.data.contadoVES,
        contadoUSD: body.data.contadoUSD,
        cerradaEn: new Date()
      }
    });
    return NextResponse.json({
      ok: true,
      cierre,
      diferenciaVES: body.data.contadoVES - esperadoVES,
      diferenciaUSD: body.data.contadoUSD - esperadoUSD
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
