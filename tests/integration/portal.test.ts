import { describe, expect, it } from "vitest";
import {
  consultarOrden,
  crearVentana,
  verificarAccesoTecnico,
  type OrdenPortal
} from "@/modules/portal/service";

const ORDENES: OrdenPortal[] = [
  {
    codigo: "OT-2026-0001",
    cedulaTelefono: "V-12345678",
    estado: "EN_REPARACION",
    tecnicoId: "tec1",
    eventos: [
      { estado: "INGRESADA", fecha: "2026-09-20" },
      { estado: "DIAGNOSTICO", fecha: "2026-09-20" }
    ]
  }
];

describe("portal consulta", () => {
  it("devuelve timeline con código + cédula correctos", () => {
    const r = consultarOrden(ORDENES, { codigo: "OT-2026-0001", identidad: "V-12345678" });
    expect(r.estado).toBe("EN_REPARACION");
    expect(r.eventos).toHaveLength(2);
    expect(r).not.toHaveProperty("tecnicoId");
  });

  it("código erróneo no filtra datos (error genérico)", () => {
    expect(() => consultarOrden(ORDENES, { codigo: "OT-9999-9999", identidad: "V-12345678" })).toThrow(
      "Orden no encontrada"
    );
  });

  it("identidad errónea da el mismo error genérico", () => {
    expect(() =>
      consultarOrden(ORDENES, { codigo: "OT-2026-0001", identidad: "otra-persona" })
    ).toThrow("Orden no encontrada");
  });

  it("rate-limit bloquea tras N intentos", () => {
    const v = crearVentana({ maxIntentos: 3, ventanaMs: 60000 });
    v.registrar("ip-1");
    v.registrar("ip-1");
    v.registrar("ip-1");
    expect(() => v.registrar("ip-1")).toThrow("Demasiados intentos");
  });

  it("técnico solo accede a asignadas", () => {
    expect(() => verificarAccesoTecnico("tec2", "tec1", "tecnico")).toThrow();
    expect(verificarAccesoTecnico("tec1", "tec1", "tecnico")).toBe(true);
    expect(verificarAccesoTecnico("cualquiera", "tec1", "admin")).toBe(true);
  });
});
