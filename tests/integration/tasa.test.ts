import { describe, expect, it } from "vitest";
import { exigirTasa, guardarTasa, recalcularConTasa, tasaVigente } from "@/modules/billing/tasa";

describe("tasa USD diaria", () => {
  it("guarda una tasa vigente por día", () => {
    const h = guardarTasa([], { fecha: "2026-09-21", valorVESporUSD: 40, usuario: "admin@taller.ve" });
    expect(tasaVigente(h, "2026-09-21")?.valorVESporUSD).toBe(40);
  });

  it("rechaza segunda tasa del mismo día sin motivo admin", () => {
    const h = guardarTasa([], { fecha: "2026-09-21", valorVESporUSD: 40, usuario: "admin@taller.ve" });
    expect(() =>
      guardarTasa(h, { fecha: "2026-09-21", valorVESporUSD: 41, usuario: "admin@taller.ve" })
    ).toThrow();
  });

  it("bloquea cobro dual sin tasa del día", () => {
    expect(() => exigirTasa([], "2026-09-21")).toThrow();
  });

  it("recambio de tasa recalcula y exige confirmación", () => {
    const r = recalcularConTasa({ totalUSDRef: 70, tasaVieja: 40, tasaNueva: 42 });
    expect(r.totalVES).toBe(2940);
    expect(r.diferenciaVES).toBe(140);
    expect(r.requiereConfirmacion).toBe(true);
  });
});
