const ventanas = new Map<string, { count: number; inicio: number }>();

/**
 * Rate-limit in-memory por clave (IP, usuario, etc.).
 * Retorna true si el request está permitido, false si debe ser bloqueado.
 */
export function rateLimit(args: {
  clave: string;
  max: number;
  ventanaMs: number;
}): boolean {
  const ahora = Date.now();
  const entry = ventanas.get(args.clave);

  if (!entry || ahora - entry.inicio > args.ventanaMs) {
    ventanas.set(args.clave, { count: 1, inicio: ahora });
    return true;
  }

  if (entry.count >= args.max) return false;

  entry.count++;
  return true;
}

// Limpieza periódica para evitar memory leak
setInterval(() => {
  const ahora = Date.now();
  Array.from(ventanas.entries()).forEach(([k, v]) => {
    if (ahora - v.inicio > 300_000) ventanas.delete(k);
  });
}, 60_000);
