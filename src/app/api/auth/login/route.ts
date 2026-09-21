import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { signSession, verifyPassword } from "@/lib/auth";
import { crearVentana } from "@/modules/portal/service";

const prisma = new PrismaClient();

const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

// In-memory por instancia (suficiente v1; multi-instancia requeriría Redis).
// 20/min: frena fuerza bruta (bcrypt ~100ms/intento) sin castigar uso normal ni e2e.
const intentosLogin = crearVentana({ maxIntentos: 20, ventanaMs: 60_000 });

function ipDe(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET no configurado");
    return "dev-secret-solo-local";
  }
  return s;
}

export async function POST(req: NextRequest) {
  try {
    intentosLogin.registrar(`login:${ipDe(req)}`);
  } catch {
    return NextResponse.json({ error: "Demasiados intentos, espera un minuto" }, { status: 429 });
  }
  const body = LoginInput.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 400 });
  }
  let user;
  try {
    user = await prisma.usuario.findUnique({
      where: { email: body.data.email.toLowerCase() }
    });
  } catch {
    return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 });
  }
  if (!user) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

  const ok = await verifyPassword(body.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

  const token = signSession({ sub: user.email, rol: user.rol }, getSecret());
  const res = NextResponse.json({ ok: true, rol: user.rol, nombre: user.nombre });
  res.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 8 * 3600
  });
  return res;
}
