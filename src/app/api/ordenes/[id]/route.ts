import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireRole } from "@/lib/require-role";

const prisma = new PrismaClient();

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const actor = requireRole(["admin", "recepcion", "tecnico"]);
  try {
    const orden = await prisma.orden.findUnique({
      where: { id: params.id },
      include: {
        equipo: { include: { cliente: true } },
        historial: { orderBy: { fecha: "asc" } },
        presupuesto: { include: { items: true } }
      }
    });
    if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    if (actor.rol === "tecnico" && orden.tecnicoId !== actor.sub) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, orden });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
