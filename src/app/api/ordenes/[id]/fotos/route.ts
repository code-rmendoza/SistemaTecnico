import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/require-role";

const prisma = new PrismaClient();

const FotoInput = z.object({
  url: z.string().url().max(2048),
  tipo: z.enum(["equipo", "dano", "reparacion", "otro"]).default("equipo"),
  nota: z.string().max(500).optional(),
});

/** Solo permite URLs de imagen (data: o https con extensión de imagen). */
function isAllowedImageUrl(url: string): boolean {
  if (url.startsWith("data:image/")) return url.length < 5_000_000; // ~5MB base64
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const path = u.pathname.toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|heic|bmp)(\?.*)?$/.test(path) || path === "/";
  } catch {
    return false;
  }
}

async function ordenPertenece(ordenId: string, userId: string): Promise<boolean> {
  const orden = await prisma.orden.findUnique({ where: { id: ordenId }, select: { tecnicoId: true } });
  return orden?.tecnicoId === userId;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const actor = requireRole(["admin", "recepcion", "tecnico"]);
  if (actor.rol === "tecnico" && !(await ordenPertenece(params.id, actor.sub))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 404 });
  }
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
  const actor = requireRole(["admin", "recepcion", "tecnico"]);
  if (actor.rol === "tecnico" && !(await ordenPertenece(params.id, actor.sub))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 404 });
  }
  const body = FotoInput.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Datos de foto inválidos" }, { status: 400 });
  }
  if (!isAllowedImageUrl(body.data.url)) {
    return NextResponse.json({ error: "URL de imagen no permitida (solo jpg/png/gif/webp, máx 5MB)" }, { status: 422 });
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
