import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { EquipoInput } from "@/modules/clients/schemas";
import { requireRole } from "@/lib/require-role";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  requireRole(["admin", "recepcion"]);
  const body = EquipoInput.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Datos de equipo inválidos" }, { status: 400 });
  }
  try {
    const cliente = await prisma.cliente.findUnique({ where: { id: body.data.clienteId } });
    if (!cliente) {
      return NextResponse.json({ error: "Cliente inexistente" }, { status: 422 });
    }
    const equipo = await prisma.equipo.create({ data: body.data });
    return NextResponse.json({ ok: true, equipo }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
