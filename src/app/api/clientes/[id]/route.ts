import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ClienteInput } from "@/modules/clients/schemas";
import { requireRole } from "@/lib/require-role";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  requireRole(["admin", "recepcion"]);
  const body = ClienteInput.partial().safeParse(await req.json().catch(() => null));
  if (!body.success || Object.keys(body.data).length === 0) {
    return NextResponse.json({ error: "Datos de cliente inválidos" }, { status: 400 });
  }
  try {
    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: body.data,
      include: { equipos: true }
    });
    return NextResponse.json({ ok: true, cliente });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Cédula/RIF ya registrada" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
