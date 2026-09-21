import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const token = cookies().get("session")?.value;
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  let session;
  try {
    session = verifySession(token, process.env.JWT_SECRET ?? "dev-secret-solo-local");
  } catch {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }
  if (!["admin", "tecnico"].includes(session.rol)) {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const ordenes = await prisma.orden.findMany({
    where: {
      estado: { notIn: ["ENTREGADA", "CANCELADA"] },
      ...(session.rol === "tecnico" ? { tecnicoId: session.sub } : {}),
    },
    include: { equipo: true },
    orderBy: { creadoEn: "desc" },
    take: 20,
  });

  return NextResponse.json({ ordenes });
}
