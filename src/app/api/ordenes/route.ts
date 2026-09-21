import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/require-role";

const prisma = new PrismaClient();

const CrearOrdenInput = z.object({
  clienteId: z.string().min(1),
  equipoId: z.string().min(1),
  fallaDeclarada: z.string().min(3),
  prioridad: z.enum(["BAJA", "NORMAL", "ALTA", "URGENTE"]).default("NORMAL")
});

async function siguienteCodigo(): Promise<string> {
  const year = new Date().getFullYear();
  const n = await prisma.orden.count({ where: { codigo: { startsWith: `OT-${year}-` } } });
  return `OT-${year}-${String(n + 1).padStart(4, "0")}`;
}

export async function GET() {
  requireRole(["admin", "recepcion", "tecnico"]);
  try {
    const ordenes = await prisma.orden.findMany({
      orderBy: { creadoEn: "desc" },
      take: 50,
      include: { equipo: { include: { cliente: true } } }
    });
    return NextResponse.json({ ok: true, ordenes });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  requireRole(["admin", "recepcion"]);
  const body = CrearOrdenInput.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Datos de orden inválidos" }, { status: 400 });
  }
  try {
    const equipo = await prisma.equipo.findFirst({
      where: { id: body.data.equipoId, clienteId: body.data.clienteId }
    });
    if (!equipo) {
      return NextResponse.json(
        { error: "El equipo no pertenece al cliente" },
        { status: 422 }
      );
    }
    const orden = await prisma.orden.create({
      data: { ...body.data, codigo: await siguienteCodigo() }
    });
    return NextResponse.json({ ok: true, orden }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
