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

export async function GET(req: NextRequest) {
  const actor = requireRole(["admin", "recepcion", "tecnico"]);
  const codigo = req.nextUrl.searchParams.get("codigo")?.trim();
  try {
    if (codigo) {
      const where: Record<string, unknown> = { codigo: { equals: codigo, mode: "insensitive" } };
      if (actor.rol === "tecnico") where.tecnicoId = actor.sub;
      const orden = await prisma.orden.findFirst({
        where,
        include: { equipo: { include: { cliente: true } }, presupuesto: true }
      });
      if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
      const cobrados = await prisma.cobro.aggregate({
        where: { ordenId: orden.id },
        _sum: { totalVES: true }
      });
      const total = orden.presupuesto ? Number(orden.presupuesto.totalVES) : 0;
      return NextResponse.json({
        ok: true,
        orden,
        totalVES: total,
        cobradoVES: Number(cobrados._sum.totalVES ?? 0),
        saldoVES: total - Number(cobrados._sum.totalVES ?? 0)
      });
    }
    const where = actor.rol === "tecnico" ? { tecnicoId: actor.sub } : {};
    const ordenes = await prisma.orden.findMany({
      where,
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
