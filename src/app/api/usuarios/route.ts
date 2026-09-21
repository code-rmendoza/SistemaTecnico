import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/require-role";
import { Role } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  requireRole(["admin"]);
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { creadoEn: "asc" },
      select: { id: true, email: true, rol: true, nombre: true, creadoEn: true }
    });
    return NextResponse.json({ ok: true, usuarios });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}

const CrearInput = z.object({
  email: z.string().email(),
  rol: Role,
  nombre: z.string().min(2),
  password: z.string().min(8)
});

export async function POST(req: NextRequest) {
  requireRole(["admin"]);
  const body = CrearInput.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Datos de usuario inválidos" }, { status: 400 });
  }
  try {
    const usuario = await prisma.usuario.create({
      data: {
        email: body.data.email.toLowerCase(),
        rol: body.data.rol,
        nombre: body.data.nombre,
        passwordHash: await bcrypt.hash(body.data.password, 12)
      },
      select: { id: true, email: true, rol: true, nombre: true, creadoEn: true }
    });
    return NextResponse.json({ ok: true, usuario }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
