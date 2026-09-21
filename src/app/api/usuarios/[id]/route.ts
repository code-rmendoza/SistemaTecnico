import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/require-role";
import { Role } from "@/lib/auth";

const prisma = new PrismaClient();
const PUBLICO = { id: true, email: true, rol: true, nombre: true, creadoEn: true };

const EditarInput = z.object({
  rol: Role.optional(),
  nombre: z.string().min(2).optional(),
  password: z.string().min(8).optional()
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = requireRole(["admin"]);
  const body = EditarInput.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  try {
    const actual = await prisma.usuario.findUnique({ where: { id: params.id } });
    if (!actual) return NextResponse.json({ error: "Usuario inexistente" }, { status: 404 });
    // Nadie se quita a sí mismo el admin (evita lockout).
    if (actual.email === actor.sub && body.data.rol && body.data.rol !== "admin") {
      return NextResponse.json({ error: "No puedes quitarte tu propio admin" }, { status: 422 });
    }
    const usuario = await prisma.usuario.update({
      where: { id: params.id },
      data: {
        ...(body.data.rol ? { rol: body.data.rol } : {}),
        ...(body.data.nombre ? { nombre: body.data.nombre } : {}),
        ...(body.data.password ? { passwordHash: await bcrypt.hash(body.data.password, 12) } : {})
      },
      select: PUBLICO
    });
    return NextResponse.json({ ok: true, usuario });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
