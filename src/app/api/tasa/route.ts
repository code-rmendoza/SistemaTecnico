import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/require-role";
import { hoyVE } from "@/lib/fecha";

const prisma = new PrismaClient();

export async function GET() {
  requireRole(["admin", "recepcion", "tecnico"]);
  try {
    const tasa = await prisma.tasaCambio.findFirst({ orderBy: { fecha: "desc" } });
    return NextResponse.json({ ok: true, tasa, hoy: hoyVE() });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}

const TasaInput = z.object({
  valorVESporUSD: z.number().positive(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export async function POST(req: NextRequest) {
  const actor = requireRole(["admin"]);
  const body = TasaInput.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Tasa inválida" }, { status: 400 });
  }
  try {
    const tasa = await prisma.tasaCambio.upsert({
      where: { fecha: new Date(body.data.fecha ?? hoyVE()) },
      update: { valorVESporUSD: body.data.valorVESporUSD, usuarioId: actor.sub },
      create: {
        fecha: new Date(body.data.fecha ?? hoyVE()),
        valorVESporUSD: body.data.valorVESporUSD,
        fuente: "MANUAL",
        usuarioId: actor.sub
      }
    });
    return NextResponse.json({ ok: true, tasa });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
