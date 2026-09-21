import { describe, expect, it } from "vitest";
import { imputarCobro } from "@/modules/billing/cobros";
import { abrirCaja, cerrarCaja, registrarMovimiento } from "@/modules/billing/caja";

describe("cobros mixtos y vuelto", () => {
  it("imputa cobro mixto exacto en VES", () => {
    const r = imputarCobro({
      totalVES: 2800,
      tasaCobro: 40,
      lineas: [
        { metodo: "EFECTIVO_USD", moneda: "USD", monto: 50 },
        { metodo: "EFECTIVO_VES", moneda: "VES", monto: 800 }
      ]
    });
    expect(r.entregadoVES).toBe(2800);
    expect(r.vueltoVES).toBe(0);
  });

  it("vuelto USD→VES: paga 20 USD por cuenta de 15 USD a tasa 40 = 200 Bs", () => {
    const r = imputarCobro({
      totalVES: 600,
      tasaCobro: 40,
      lineas: [{ metodo: "EFECTIVO_USD", moneda: "USD", monto: 20 }]
    });
    expect(r.entregadoVES).toBe(800);
    expect(r.vueltoVES).toBe(200);
    expect(r.vueltoMoneda).toBe("VES");
  });

  it("rechaza faltante y sobrepago sin efectivo", () => {
    expect(() =>
      imputarCobro({
        totalVES: 1000,
        tasaCobro: 40,
        lineas: [{ metodo: "EFECTIVO_VES", moneda: "VES", monto: 500 }]
      })
    ).toThrow();
    expect(() =>
      imputarCobro({
        totalVES: 1000,
        tasaCobro: 40,
        lineas: [{ metodo: "PAGO_MOVIL", moneda: "VES", monto: 1500 }]
      })
    ).toThrow();
  });
});

describe("caja dual", () => {
  it("cierra con diferencia por moneda", () => {
    const caja = abrirCaja({
      fecha: "2026-09-21",
      usuario: "recepcion@taller.ve",
      tasa: 40,
      inicialVES: 0,
      inicialUSD: 0
    });
    const c2 = registrarMovimiento(caja, { moneda: "VES", monto: 2800, concepto: "OT-1" });
    const c3 = registrarMovimiento(c2, { moneda: "USD", monto: 20, concepto: "OT-2" });
    const cierre = cerrarCaja(c3, { contadoVES: 2700, contadoUSD: 20, tasaCierre: 40 });
    expect(cierre.diferenciaVES).toBe(-100);
    expect(cierre.diferenciaUSD).toBe(0);
    expect(cierre.totalVESConvertido).toBe(2700 + 20 * 40);
  });
});
