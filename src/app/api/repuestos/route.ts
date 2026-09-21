import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { RepuestoInput } from "@/modules/inventory/service";
import { requireRole } from "@/lib/require-role";

const prisma = new PrismaClient();

export async function GET() {
  requireRole(["admin", "recepcion", "tecnico"]);
  try {
    const repuestos = await prisma.repuesto.findMany({
      orderBy: { sku: "asc" },
      take: 100
    });
    return NextResponse.json({ ok: true, repuestos });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  requireRole(["admin", "recepcion"]);
  const body = RepuestoInput.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Datos de repuesto inválidos" }, { status: 400 });
  }
  try {
    const repuesto = await prisma.repuesto.create({ data: body.data });
    return NextResponse.json({ ok: true, repuesto }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "SKU ya registrado" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
