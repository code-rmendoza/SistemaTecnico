import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { crearVentana } from "@/modules/portal/service";

const prisma = new PrismaClient();

const ConsultaInput = z.object({
  codigo: z.string().min(3),
  identidad: z.string().min(3)
});

// In-memory por instancia (suficiente v1; multi-instancia requeriría Redis).
const intentosPortal = crearVentana({ maxIntentos: 10, ventanaMs: 60_000 });

function ipDe(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(req: NextRequest) {
  try {
    intentosPortal.registrar(`portal:${ipDe(req)}`);
  } catch {
    return NextResponse.json({ error: "Demasiados intentos, espera un minuto" }, { status: 429 });
  }
  const body = ConsultaInput.safeParse(await req.json().catch(() => null));
  // Error genérico a propósito en ambos casos: no enumerar órdenes.
  if (!body.success) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }
  const { codigo, identidad } = body.data;
  try {
    const orden = await prisma.orden.findFirst({
      where: {
        codigo: { equals: codigo.trim(), mode: "insensitive" },
        equipo: {
          cliente: {
            OR: [
              { cedulaRif: { equals: identidad.trim(), mode: "insensitive" } },
              { telefono: { equals: identidad.trim(), mode: "insensitive" } }
            ]
          }
        }
      },
      include: { equipo: { include: { cliente: true } } }
    });
    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      codigo: orden.codigo,
      estado: orden.estado,
      falla: orden.fallaDeclarada,
      fechaPromesa: orden.fechaPromesa
    });
  } catch {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }
}
