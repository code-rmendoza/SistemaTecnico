"use client";

import { useState } from "react";
import { transicionar, type Orden } from "@/modules/orders/service";
import { crearRepuesto } from "@/modules/inventory/service";
import { Button, Card, EstadoBadge, Page, PageHeader } from "@/components/ui";

const ORDENES: Orden[] = [
  {
    id: "ot_1",
    codigo: "OT-2026-0002",
    clienteId: "cli_2",
    equipoId: "eq_2",
    fallaDeclarada: "Pantalla rota",
    prioridad: "NORMAL",
    estado: "APROBADA",
    auditoria: []
  }
];

const STOCK = [
  crearRepuesto({ sku: "REP-0001", nombre: "Pantalla 6.5", stock: 8, stockMinimo: 2, costoUSD: 12.5, precioUSD: 25 })
];

export default function MovilPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>(ORDENES);

  function avanzar(id: string) {
    setOrdenes((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        try {
          return transicionar(o, "EN_REPARACION", "tecnico@taller.ve");
        } catch {
          return o;
        }
      })
    );
  }

  return (
    <Page>
      <PageHeader title="Mi cola" sub="Vista técnico. Ruta protegida: técnico, admin. Solo muestra asignadas." />
      <ul className="flex flex-col gap-2">
        {ordenes.map((o) => (
          <li key={o.id}>
            <Card>
              <p className="text-sm"><strong>{o.codigo}</strong> <EstadoBadge estado={o.estado} /></p>
              <p className="text-sm text-stone-500">{o.fallaDeclarada}</p>
              <Button variant="outline" className="mt-2" onClick={() => avanzar(o.id)}>
                Pasar a reparación
              </Button>
            </Card>
          </li>
        ))}
      </ul>
      <h2 className="mb-2 mt-5 text-sm font-bold">Stock consultable</h2>
      <Card>
        <ul className="text-sm">
          {STOCK.map((r) => (
            <li key={r.id}>{r.sku} — {r.nombre} (stock {r.stock})</li>
          ))}
        </ul>
      </Card>
    </Page>
  );
}
