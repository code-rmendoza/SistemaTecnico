import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Registra una acción en el audit log.
 * Llamado desde API routes después de una operación exitosa.
 */
export async function auditLog(args: {
  usuarioId: string;
  accion: string;
  recurso: string;
  recursoId?: string;
  detalles?: string;
  ip?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        usuarioId: args.usuarioId,
        accion: args.accion,
        recurso: args.recurso,
        recursoId: args.recursoId,
        detalles: args.detalles,
        ip: args.ip,
      },
    });
  } catch {
    // El audit log nunca debe bloquear la operación principal
  }
}
