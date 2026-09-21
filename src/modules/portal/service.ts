export interface EventoPortal {
  estado: string;
  fecha: string;
}

export interface OrdenPortal {
  codigo: string;
  /** cédula/RIF o teléfono del dueño (se compara normalizado) */
  cedulaTelefono: string;
  estado: string;
  tecnicoId: string;
  eventos: EventoPortal[];
}

export interface TimelinePortal {
  codigo: string;
  estado: string;
  eventos: EventoPortal[];
}

const ERROR_GENERICO = "Orden no encontrada";

function norm(s: string): string {
  return s.trim().toLowerCase();
}

export function consultarOrden(
  ordenes: OrdenPortal[],
  input: { codigo: string; identidad: string }
): TimelinePortal {
  const o = ordenes.find(
    (x) => norm(x.codigo) === norm(input.codigo) && norm(x.cedulaTelefono) === norm(input.identidad)
  );
  // Mismo error para código o identidad erróneos: no enumerar.
  // Se devuelve solo lo público: nunca tecnicoId ni identidad del dueño.
  if (!o) throw new Error(ERROR_GENERICO);
  return { codigo: o.codigo, estado: o.estado, eventos: o.eventos };
}

export function crearVentana(args: { maxIntentos: number; ventanaMs: number }): {
  registrar: (clave: string) => void;
} {
  const intentos = new Map<string, number[]>();
  return {
    registrar(clave: string) {
      const ahora = Date.now();
      const lista = (intentos.get(clave) ?? []).filter((t) => ahora - t < args.ventanaMs);
      if (lista.length >= args.maxIntentos) throw new Error("Demasiados intentos");
      intentos.set(clave, [...lista, ahora]);
    }
  };
}

export function verificarAccesoTecnico(
  solicitanteId: string,
  asignadoId: string,
  rol: string
): boolean {
  if (rol === "admin") return true;
  if (solicitanteId !== asignadoId) throw new Error("Prohibido: orden no asignada");
  return true;
}
