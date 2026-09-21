import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/require-role";

const prisma = new PrismaClient();

const AsignarInput = z.object({
  tecnicoId: z.string().min(1),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  requireRole(["admin", "recepcion"]);
  const body = AsignarInput.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "tecnicoId requerido" }, { status: 400 });
  }
  try {
    const tecnico = await prisma.usuario.findFirst({
      where: { id: body.data.tecnicoId, rol: "tecnico" },
    });
    if (!tecnico) {
      return NextResponse.json({ error: "Técnico no válido" }, { status: 422 });
    }
    const orden = await prisma.orden.update({
      where: { id: params.id },
      data: { tecnicoId: body.data.tecnicoId },
      include: { equipo: { include: { cliente: true } } },
    });
    return NextResponse.json({ ok: true, orden });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
