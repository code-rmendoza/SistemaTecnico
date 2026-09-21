import { describe, expect, it } from "vitest";
import { canTransition } from "@/lib/order-status";

describe("canTransition", () => {
  it("permite INGRESADA → DIAGNOSTICO", () => {
    expect(canTransition("INGRESADA", "DIAGNOSTICO")).toBe(true);
  });

  it("rechaza INGRESADA → ENTREGADA", () => {
    expect(canTransition("INGRESADA", "ENTREGADA")).toBe(false);
  });

  it("exige aprobación: PRESUPUESTADA no salta a EN_REPARACION", () => {
    expect(canTransition("PRESUPUESTADA", "EN_REPARACION")).toBe(false);
    expect(canTransition("PRESUPUESTADA", "APROBADA")).toBe(true);
  });
});
