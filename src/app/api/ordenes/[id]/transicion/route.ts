import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/require-role";
import { canTransition, OrderStatus } from "@/lib/order-status";

const prisma = new PrismaClient();

const TransicionInput = z.object({ a: OrderStatus });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = requireRole(["admin", "recepcion", "tecnico"]);
  const body = TransicionInput.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }
  try {
    const orden = await prisma.orden.findUnique({ where: { id: params.id } });
    if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    if (!canTransition(orden.estado, body.data.a)) {
      return NextResponse.json(
        { error: `Transición inválida ${orden.estado} → ${body.data.a}` },
        { status: 422 }
      );
    }
    const actualizada = await prisma.orden.update({
      where: { id: params.id },
      data: {
        estado: body.data.a,
        historial: { create: { de: orden.estado, a: body.data.a, usuario: actor.sub } }
      },
      include: { historial: { orderBy: { fecha: "asc" } }, presupuesto: true }
    });
    return NextResponse.json({ ok: true, orden: actualizada });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
