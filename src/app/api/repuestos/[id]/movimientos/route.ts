import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/require-role";

const prisma = new PrismaClient();

const MovimientoApi = z.object({
  tipo: z.enum(["ENTRADA", "SALIDA_ORDEN", "AJUSTE"]),
  cantidad: z.number().int().min(1),
  refOrden: z.string().optional(),
  motivo: z.string().optional()
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = requireRole(["admin", "recepcion", "tecnico"]);
  const body = MovimientoApi.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Movimiento inválido" }, { status: 400 });
  }
  const { tipo, cantidad, refOrden, motivo } = body.data;
  if (tipo === "SALIDA_ORDEN" && !refOrden) {
    return NextResponse.json({ error: "SALIDA_ORDEN exige refOrden" }, { status: 422 });
  }
  if (tipo === "AJUSTE" && !motivo) {
    return NextResponse.json({ error: "AJUSTE exige motivo auditado" }, { status: 422 });
  }
  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const r = await tx.repuesto.findUnique({ where: { id: params.id } });
      if (!r) throw new Error("NOT_FOUND");
      const stockDespues = r.stock + (tipo === "ENTRADA" ? cantidad : -cantidad);
      if (stockDespues < 0) throw new Error("STOCK_INSUFICIENTE");
      const [actualizado, movimiento] = await Promise.all([
        tx.repuesto.update({ where: { id: params.id }, data: { stock: stockDespues } }),
        tx.movimiento.create({
          data: {
            repuestoId: params.id,
            tipo,
            cantidad,
            refOrden: refOrden ?? null,
            motivo: motivo ?? null,
            usuario: actor.sub,
            stockAntes: r.stock,
            stockDespues
          }
        })
      ]);
      return { actualizado, movimiento };
    });
    return NextResponse.json(
      { ok: true, repuesto: resultado.actualizado, movimiento: resultado.movimiento },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof Error && (e.message === "NOT_FOUND")) {
      return NextResponse.json({ error: "Repuesto inexistente" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "STOCK_INSUFICIENTE") {
      return NextResponse.json(
        { error: "Stock insuficiente: requiere AJUSTE auditado" },
        { status: 422 }
      );
    }
    return NextResponse.json({ ok: false, error: "Servicio no disponible" }, { status: 503 });
  }
}
