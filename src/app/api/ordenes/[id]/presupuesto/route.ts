import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireRole } from "@/lib/require-role";
import { PresupuestoInput } from "@/modules/orders/schemas";
import { calcularPresupuesto } from "@/modules/orders/service";

const prisma = new PrismaClient();

/** Crea/reemplaza el presupuesto (solo en DIAGNOSTICO o PRESUPUESTADA). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  requireRole(["admin", "recepcion", "tecnico"]);
  const body = PresupuestoInput.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Presupuesto inválido" }, { status: 400 });
  }
  try {
    const orden = await prisma.orden.findUnique({
      where: { id: params.id },
      include: { presupuesto: true }
    });
    if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    if (orden.estado !== "DIAGNOSTICO" && orden.estado !== "PRESUPUESTADA") {
      return NextResponse.json(
        { error: "Solo se presupuesta en DIAGNOSTICO" },
        { status: 422 }
      );
    }
    const calc = calcularPresupuesto(body.data);
    const [presupuesto] = await prisma.$transaction([
      prisma.presupuesto.upsert({
        where: { ordenId: params.id },
        update: {
          manoObraUSD: body.data.manoObraUSD,
          tasaRef: calc.tasaRef,
          totalUSDRef: calc.totalUSDRef,
          totalVES: calc.totalVES,
          validezDias: body.data.validezDias ?? 7,
          aprobada: false,
          aprobadaPor: null,
          aprobadaEn: null
        },
        create: {
          ordenId: params.id,
          manoObraUSD: body.data.manoObraUSD,
          tasaRef: calc.tasaRef,
          totalUSDRef: calc.totalUSDRef,
          totalVES: calc.totalVES,
          validezDias: body.data.validezDias ?? 7
        }
      }),
      prisma.orden.update({
        where: { id: params.id },
        data: {
          estado: "PRESUPUESTADA",
          historial: {
            create: { de: orden.estado, a: "PRESUPUESTADA", usuario: "sistema" }
          }
        }
      })
    ]);
    return NextResponse.json({ ok: true, presupuesto }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}

/** Aprueba el presupuesto (solo desde PRESUPUESTADA). No descuenta stock aún (pendiente inventario real). */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = requireRole(["admin", "recepcion"]);
  try {
    const orden = await prisma.orden.findUnique({
      where: { id: params.id },
      include: { presupuesto: true }
    });
    if (!orden?.presupuesto) {
      return NextResponse.json({ error: "Sin presupuesto para aprobar" }, { status: 422 });
    }
    if (orden.estado !== "PRESUPUESTADA") {
      return NextResponse.json({ error: "Solo se aprueba desde PRESUPUESTADA" }, { status: 422 });
    }
    const [, actualizada] = await prisma.$transaction([
      prisma.presupuesto.update({
        where: { ordenId: params.id },
        data: { aprobada: true, aprobadaPor: actor.sub, aprobadaEn: new Date() }
      }),
      prisma.orden.update({
        where: { id: params.id },
        data: {
          estado: "APROBADA",
          historial: { create: { de: "PRESUPUESTADA", a: "APROBADA", usuario: actor.sub } }
        },
        include: { historial: { orderBy: { fecha: "asc" } }, presupuesto: true }
      })
    ]);
    return NextResponse.json({ ok: true, orden: actualizada });
  } catch {
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
