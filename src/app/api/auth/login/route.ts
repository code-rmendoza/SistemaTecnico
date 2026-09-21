import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Role, signSession, verifyPassword, hashPassword } from "@/lib/auth";
import { crearVentana } from "@/modules/portal/service";

const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

// DEMO temporal hasta seed DB (T3): usuarios por rol con misma clave demo.
const DEMO_PASSWORD = "demo1234";
let demoHash: string | null = null;
const DEMO_USERS: { email: string; rol: Role; nombre: string }[] = [
  { email: "admin@taller.ve", rol: "admin", nombre: "Admin" },
  { email: "recepcion@taller.ve", rol: "recepcion", nombre: "Recepción" },
  { email: "tecnico@taller.ve", rol: "tecnico", nombre: "Técnico" },
  { email: "cliente@taller.ve", rol: "cliente", nombre: "Cliente" }
];

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET no configurado");
    return "dev-secret-solo-local";
  }
  return s;
}

// In-memory por instancia (suficiente v1; multi-instancia requeriría Redis).
// 20/min: frena fuerza bruta (bcrypt ~100ms/intento) sin castigar uso normal ni e2e.
const intentosLogin = crearVentana({ maxIntentos: 20, ventanaMs: 60_000 });

function ipDe(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
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
  const user = DEMO_USERS.find((u) => u.email === body.data.email.toLowerCase());
  if (!user) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

  demoHash ??= await hashPassword(DEMO_PASSWORD);
  const ok = await verifyPassword(body.data.password, demoHash);
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
