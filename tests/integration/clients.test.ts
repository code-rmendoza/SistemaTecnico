import { describe, expect, it } from "vitest";
import {
  crearCliente,
  crearEquipo,
  buscarClientes,
  historialPorCliente,
  type Cliente,
  type Equipo,
  type OrdenResumen
} from "@/modules/clients/service";

const base = {
  nombre: "María Pérez",
  cedulaRif: "V-12345678",
  telefono: "04120000000"
};

describe("clients service", () => {
  it("crea cliente válido con cédula/RIF y teléfono", () => {
    const c = crearCliente(base);
    expect(c.id).toBeDefined();
    expect(c.cedulaRif).toBe("V-12345678");
  });

  it("rechaza cliente sin teléfono", () => {
    expect(() => crearCliente({ ...base, telefono: "" })).toThrow();
  });

  it("crea equipo vinculado a cliente", () => {
    const c = crearCliente(base);
    const e = crearEquipo({
      clienteId: c.id,
      tipo: "celular",
      marca: "Samsung",
      modelo: "A54"
    });
    expect(e.clienteId).toBe(c.id);
  });

  it("rechaza equipo sin clienteId (no hay orden sin cliente+equipo)", () => {
    expect(() =>
      crearEquipo({ clienteId: "", tipo: "celular", marca: "X", modelo: "Y" })
    ).toThrow();
  });

  it("busca por teléfono o cédula", () => {
    const clientes: Cliente[] = [
      crearCliente(base),
      crearCliente({ nombre: "José", cedulaRif: "V-87654321", telefono: "04141111111" })
    ];
    expect(buscarClientes(clientes, "0412000")).toHaveLength(1);
    expect(buscarClientes(clientes, "V-8765")).toHaveLength(1);
    expect(buscarClientes(clientes, "inexistente")).toHaveLength(0);
  });

  it("arma historial por cliente con sus órdenes", () => {
    const c = crearCliente(base);
    const eq: Equipo = crearEquipo({
      clienteId: c.id,
      tipo: "celular",
      marca: "Samsung",
      modelo: "A54"
    });
    const ordenes: OrdenResumen[] = [
      { id: "o1", codigo: "OT-2026-0001", clienteId: c.id, equipoId: eq.id, estado: "ENTREGADA" },
      { id: "o2", codigo: "OT-2026-0002", clienteId: "otro", equipoId: "otro", estado: "INGRESADA" }
    ];
    const h = historialPorCliente(c.id, [eq], ordenes);
    expect(h.equipos).toHaveLength(1);
    expect(h.ordenes.map((o) => o.codigo)).toEqual(["OT-2026-0001"]);
  });
});
