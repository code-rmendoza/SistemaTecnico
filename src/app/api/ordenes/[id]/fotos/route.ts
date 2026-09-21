import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/require-role";

const prisma = new PrismaClient();

const FotoInput = z.object({
  url: z.string().url(),
  tipo: z.enum(["equipo", "dano", "reparacion", "otro"]).default("equipo"),
  nota: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  requireRole(["admin", "recepcion", "tecnico"]);
  try {
    const fotos = await prisma.foto.findMany({
      where: { ordenId: params.id },
      orderBy: { creadoEn: "asc" },
    });
    return NextResponse.json({ ok: true, fotos });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  requireRole(["admin", "recepcion", "tecnico"]);
  const body = FotoInput.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Datos de foto inválidos" }, { status: 400 });
  }
  try {
    const foto = await prisma.foto.create({
      data: { ordenId: params.id, ...body.data },
    });
    return NextResponse.json({ ok: true, foto }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  requireRole(["admin", "recepcion"]);
  const fotoId = req.nextUrl.searchParams.get("fotoId");
  if (!fotoId) {
    return NextResponse.json({ error: "fotoId requerido" }, { status: 400 });
  }
  try {
    await prisma.foto.deleteMany({ where: { id: fotoId, ordenId: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
