import { describe, expect, it } from "vitest";
import {
  aprobarPresupuesto,
  calcularPresupuesto,
  consumirStockParaOrden,
  crearOrden,
  transicionar
} from "@/modules/orders/service";
import { crearRepuesto } from "@/modules/inventory/service";

describe("orders budget", () => {
  it("calcula total USD y conversión VES con tasaRef", () => {
    const p = calcularPresupuesto({
      manoObraUSD: 20,
      repuestos: [{ sku: "REP-0001", cantidad: 2, precioUSD: 25 }],
      tasaRef: 40
    });
    expect(p.totalUSDRef).toBe(70);
    expect(p.totalVES).toBe(2800);
    expect(p.tasaRef).toBe(40);
  });

  it("solo aprueba desde PRESUPUESTADA", () => {
    const o = crearOrden(
      { clienteId: "c", equipoId: "e", fallaDeclarada: "No enciende" },
      "OT-1"
    );
    expect(() =>
      aprobarPresupuesto(o, { totalUSDRef: 10, totalVES: 400, tasaRef: 40 }, "r")
    ).toThrow();
    const o2 = transicionar(transicionar(o, "DIAGNOSTICO", "t"), "PRESUPUESTADA", "t");
    const o3 = aprobarPresupuesto(
      o2,
      { totalUSDRef: 10, totalVES: 400, tasaRef: 40 },
      "recepcion@taller.ve"
    );
    expect(o3.estado).toBe("APROBADA");
  });

  it("sin aprobación no pasa a EN_REPARACION", () => {
    const o = crearOrden(
      { clienteId: "c", equipoId: "e", fallaDeclarada: "No enciende" },
      "OT-1"
    );
    const o2 = transicionar(transicionar(o, "DIAGNOSTICO", "t"), "PRESUPUESTADA", "t");
    expect(() => transicionar(o2, "EN_REPARACION", "t")).toThrow();
  });

  it("consume stock exacto o revierte todo", () => {
    const rep = crearRepuesto({
      sku: "REP-0001",
      nombre: "Pantalla",
      stock: 2,
      stockMinimo: 0,
      costoUSD: 10,
      precioUSD: 25
    });
    const ok = consumirStockParaOrden(
      { "REP-0001": rep },
      [],
      "OT-1",
      [{ sku: "REP-0001", cantidad: 2 }],
      "tecnico@taller.ve"
    );
    expect(ok.repuestos["REP-0001"].stock).toBe(0);

    expect(() =>
      consumirStockParaOrden(
        { "REP-0001": rep },
        [],
        "OT-1",
        [{ sku: "REP-0001", cantidad: 5 }],
        "tecnico@taller.ve"
      )
    ).toThrow();
  });
});
