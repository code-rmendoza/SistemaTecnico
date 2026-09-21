import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ClienteInput } from "@/modules/clients/schemas";
import { requireRole } from "@/lib/require-role";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  requireRole(["admin", "recepcion", "tecnico"]);
  const q = req.nextUrl.searchParams.get("q") ?? "";
  try {
    const clientes = await prisma.cliente.findMany({
      where: {
        OR: [
          { nombre: { contains: q, mode: "insensitive" } },
          { cedulaRif: { contains: q, mode: "insensitive" } },
          { telefono: { contains: q, mode: "insensitive" } }
        ]
      },
      take: 20,
      include: { equipos: true }
    });
    return NextResponse.json({ ok: true, clientes });
  } catch {
    return NextResponse.json(
      { ok: false, error: "DB no disponible (pendiente migrate). Usa /clientes demo local." },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  requireRole(["admin", "recepcion"]);
  const body = ClienteInput.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Datos de cliente inválidos" }, { status: 400 });
  }
  try {
    const cliente = await prisma.cliente.create({ data: body.data });
    return NextResponse.json({ ok: true, cliente }, { status: 201 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "DB no disponible (pendiente migrate)" },
      { status: 503 }
    );
  }
}
