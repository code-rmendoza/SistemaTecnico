import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireRole } from "@/lib/require-role";
import { rateLimit } from "@/lib/rate-limit";
import { PresupuestoInput } from "@/modules/orders/schemas";
import { calcularPresupuesto } from "@/modules/orders/service";

const prisma = new PrismaClient();

/** Crea/reemplaza el presupuesto (solo en DIAGNOSTICO o PRESUPUESTADA). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = requireRole(["admin", "recepcion", "tecnico"]);
  if (!rateLimit({ clave: `presupuesto:${actor.sub}`, max: 15, ventanaMs: 60_000 })) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }
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
    // Valida que los SKUs existan antes de guardar.
    if (body.data.repuestos.length > 0) {
      const skus = Array.from(new Set(body.data.repuestos.map((r) => r.sku)));
      const existentes = await prisma.repuesto.findMany({
        where: { sku: { in: skus } },
        select: { sku: true }
      });
      const faltante = skus.find((s) => !existentes.some((e) => e.sku === s));
      if (faltante) {
        return NextResponse.json({ error: `Repuesto inexistente ${faltante}` }, { status: 422 });
      }
    }
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
          aprobadaEn: null,
          items: {
            deleteMany: {},
            create: body.data.repuestos.map((r) => ({
              sku: r.sku,
              cantidad: r.cantidad,
              precioUSD: r.precioUSD
            }))
          }
        },
        create: {
          ordenId: params.id,
          manoObraUSD: body.data.manoObraUSD,
          tasaRef: calc.tasaRef,
          totalUSDRef: calc.totalUSDRef,
          totalVES: calc.totalVES,
          validezDias: body.data.validezDias ?? 7,
          items: {
            create: body.data.repuestos.map((r) => ({
              sku: r.sku,
              cantidad: r.cantidad,
              precioUSD: r.precioUSD
            }))
          }
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

/** Aprueba el presupuesto (solo desde PRESUPUESTADA) y descuenta stock en la misma transacción. */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = requireRole(["admin", "recepcion"]);
  if (!rateLimit({ clave: `aprobar:${actor.sub}`, max: 10, ventanaMs: 60_000 })) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }
  try {
    const orden = await prisma.orden.findUnique({
      where: { id: params.id },
      include: { presupuesto: { include: { items: true } } }
    });
    if (!orden?.presupuesto) {
      return NextResponse.json({ error: "Sin presupuesto para aprobar" }, { status: 422 });
    }
    if (orden.estado !== "PRESUPUESTADA") {
      return NextResponse.json({ error: "Solo se aprueba desde PRESUPUESTADA" }, { status: 422 });
    }
    const actualizada = await prisma.$transaction(async (tx) => {
      // Descuento atómico: verifica todo antes de tocar nada.
      for (const item of orden.presupuesto!.items) {
        const rep = await tx.repuesto.findFirst({ where: { sku: item.sku } });
        if (!rep) throw new Error(`REPUESTO_INEXISTENTE:${item.sku}`);
        if (rep.stock < item.cantidad) throw new Error(`STOCK_INSUFICIENTE:${item.sku}`);
      }
      for (const item of orden.presupuesto!.items) {
        const rep = await tx.repuesto.findFirst({ where: { sku: item.sku } });
        if (!rep) throw new Error(`REPUESTO_INEXISTENTE:${item.sku}`);
        await tx.repuesto.update({
          where: { id: rep.id },
          data: { stock: rep.stock - item.cantidad }
        });
        await tx.movimiento.create({
          data: {
            repuestoId: rep.id,
            tipo: "SALIDA_ORDEN",
            cantidad: item.cantidad,
            refOrden: orden.codigo,
            usuario: actor.sub,
            stockAntes: rep.stock,
            stockDespues: rep.stock - item.cantidad
          }
        });
      }
      await tx.presupuesto.update({
        where: { ordenId: params.id },
        data: { aprobada: true, aprobadaPor: actor.sub, aprobadaEn: new Date() }
      });
      return tx.orden.update({
        where: { id: params.id },
        data: {
          estado: "APROBADA",
          historial: { create: { de: "PRESUPUESTADA", a: "APROBADA", usuario: actor.sub } }
        },
        include: {
          historial: { orderBy: { fecha: "asc" } },
          presupuesto: { include: { items: true } }
        }
      });
    });
    return NextResponse.json({ ok: true, orden: actualizada });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("STOCK_INSUFICIENTE")) {
      return NextResponse.json(
        { error: `Stock insuficiente para ${e.message.split(":")[1]}: aprobación bloqueada` },
        { status: 422 }
      );
    }
    if (e instanceof Error && e.message.startsWith("REPUESTO_INEXISTENTE")) {
      return NextResponse.json(
        { error: `Repuesto inexistente ${e.message.split(":")[1]}` },
        { status: 422 }
      );
    }
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
