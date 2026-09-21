import { ClienteInput, EquipoInput } from "./schemas";

export interface Cliente extends ClienteInput {
  id: string;
  creadoEn: Date;
}

export interface Equipo extends EquipoInput {
  id: string;
  creadoEn: Date;
}

export interface OrdenResumen {
  id: string;
  codigo: string;
  clienteId: string;
  equipoId: string;
  estado: string;
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function crearCliente(input: ClienteInput): Cliente {
  const data = ClienteInput.parse(input);
  return { ...data, id: uid("cli"), creadoEn: new Date() };
}

export function crearEquipo(input: EquipoInput): Equipo {
  const data = EquipoInput.parse(input);
  return { ...data, id: uid("eq"), creadoEn: new Date() };
}

export function buscarClientes(clientes: Cliente[], query: string): Cliente[] {
  const q = query.trim().toLowerCase();
  if (!q) return clientes;
  return clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(q) ||
      c.cedulaRif.toLowerCase().includes(q) ||
      c.telefono.toLowerCase().includes(q)
  );
}

export function historialPorCliente(
  clienteId: string,
  equipos: Equipo[],
  ordenes: OrdenResumen[]
): { equipos: Equipo[]; ordenes: OrdenResumen[] } {
  return {
    equipos: equipos.filter((e) => e.clienteId === clienteId),
    ordenes: ordenes.filter((o) => o.clienteId === clienteId)
  };
}
