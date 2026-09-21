import { describe, expect, it } from "vitest";
import {
  crearRepuesto,
  moverStock,
  bajoMinimo,
  kardexPorSku,
  type Movimiento,
  type Repuesto
} from "@/modules/inventory/service";

const base = {
  sku: "REP-0001",
  nombre: "Pantalla 6.5",
  stock: 10,
  stockMinimo: 2,
  costoUSD: 12.5,
  precioUSD: 25
};

describe("inventory service", () => {
  it("crea repuesto con stock inicial", () => {
    expect(crearRepuesto(base).stock).toBe(10);
  });

  it("descuenta salida vinculada a orden", () => {
    const r = crearRepuesto(base);
    const { repuesto, movimiento } = moverStock(r, [], {
      tipo: "SALIDA_ORDEN",
      cantidad: 2,
      refOrden: "OT-2026-0001",
      usuario: "tecnico@taller.ve"
    });
    expect(repuesto.stock).toBe(8);
    expect(movimiento.refOrden).toBe("OT-2026-0001");
  });

  it("bloquea salida que deja stock negativo sin ajuste", () => {
    const r = crearRepuesto({ ...base, stock: 1 });
    expect(() =>
      moverStock(r, [], {
        tipo: "SALIDA_ORDEN",
        cantidad: 2,
        refOrden: "OT-1",
        usuario: "t"
      })
    ).toThrow();
  });

  it("permite ajuste auditado con motivo", () => {
    const r = crearRepuesto({ ...base, stock: 1 });
    const { repuesto } = moverStock(r, [], {
      tipo: "AJUSTE",
      cantidad: -1,
      motivo: "rotura",
      usuario: "admin@taller.ve"
    });
    expect(repuesto.stock).toBe(0);
  });

  it("exige motivo en ajuste y refOrden en salida", () => {
    const r = crearRepuesto(base);
    expect(() => moverStock(r, [], { tipo: "AJUSTE", cantidad: 1, usuario: "a" })).toThrow();
    expect(() =>
      moverStock(r, [], { tipo: "SALIDA_ORDEN", cantidad: 1, usuario: "t" })
    ).toThrow();
  });

  it("alerta bajo mínimo y arma kardex", () => {
    const r = crearRepuesto({ ...base, stock: 2 });
    expect(bajoMinimo(r)).toBe(true);
    const movs: Movimiento[] = [];
    const s1 = moverStock(r, movs, { tipo: "ENTRADA", cantidad: 5, usuario: "admin@taller.ve" });
    expect(kardexPorSku(s1.movimientos, "REP-0001")).toHaveLength(1);
  });
});
