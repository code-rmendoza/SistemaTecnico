/** Fecha YYYY-MM-DD en America/Caracas (UTC-4, sin horario de verano). */
export function hoyVE(fecha = new Date()): string {
  return new Date(fecha.getTime() - 4 * 3600_000).toISOString().slice(0, 10);
}
