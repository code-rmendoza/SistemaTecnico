import { describe, expect, it } from "vitest";
import { crearOrden, transicionar } from "@/modules/orders/service";

const base = {
  clienteId: "cli_1",
  equipoId: "eq_1",
  fallaDeclarada: "No enciende"
};

describe("orders status", () => {
  it("crea orden INGRESADA con código único", () => {
    const o = crearOrden(base, "OT-2026-0001");
    expect(o.estado).toBe("INGRESADA");
    expect(o.codigo).toBe("OT-2026-0001");
    expect(o.auditoria).toHaveLength(0);
  });

  it("exige cliente+equipo (no hay orden huérfana)", () => {
    expect(() => crearOrden({ ...base, clienteId: "" }, "OT-1")).toThrow();
    expect(() => crearOrden({ ...base, equipoId: "" }, "OT-1")).toThrow();
  });

  it("permite transición válida y audita", () => {
    const o = crearOrden(base, "OT-1");
    const o2 = transicionar(o, "DIAGNOSTICO", "tecnico@taller.ve");
    expect(o2.estado).toBe("DIAGNOSTICO");
    expect(o2.auditoria).toHaveLength(1);
    expect(o2.auditoria[0]).toMatchObject({ de: "INGRESADA", a: "DIAGNOSTICO" });
  });

  it("rechaza transición inválida INGRESADA→ENTREGADA", () => {
    const o = crearOrden(base, "OT-1");
    expect(() => transicionar(o, "ENTREGADA", "t")).toThrow();
  });
});
