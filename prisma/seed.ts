import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  for (const u of [
    { email: "admin@taller.ve", rol: "admin" as const, nombre: "Admin" },
    { email: "recepcion@taller.ve", rol: "recepcion" as const, nombre: "Recepción" },
    { email: "tecnico@taller.ve", rol: "tecnico" as const, nombre: "Técnico" },
    { email: "cliente@taller.ve", rol: "cliente" as const, nombre: "Cliente Demo" }
  ]) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash }
    });
  }

  const cliente = await prisma.cliente.upsert({
    where: { cedulaRif: "V-12345678" },
    update: {},
    create: {
      nombre: "Cliente Demo",
      cedulaRif: "V-12345678",
      telefono: "04120000000",
      email: "cliente@taller.ve",
      direccion: "Caracas, VE"
    }
  });

  const equipo =
    (await prisma.equipo.findFirst({
      where: { clienteId: cliente.id, serieImei: "356000000000000" }
    })) ??
    (await prisma.equipo.create({
      data: {
        clienteId: cliente.id,
        tipo: "celular",
        marca: "Demo",
        modelo: "X1",
        serieImei: "356000000000000",
        accesorios: "Sin accesorios"
      }
    }));

  await prisma.orden.upsert({
    where: { codigo: "OT-2026-0001" },
    update: {},
    create: {
      codigo: "OT-2026-0001",
      clienteId: cliente.id,
      equipoId: equipo.id,
      estado: "EN_REPARACION",
      fallaDeclarada: "No enciende (demo)",
      prioridad: "NORMAL",
      garantiaDias: 30
    }
  });

  await prisma.repuesto.upsert({
    where: { sku: "REP-0001" },
    update: {},
    create: {
      sku: "REP-0001",
      nombre: "Pantalla genérica 6.5",
      stock: 10,
      stockMinimo: 2,
      costoUSD: 12.5,
      precioUSD: 25,
      ubicacion: "A-01"
    }
  });

  await prisma.tasaCambio.upsert({
    where: { fecha: new Date(new Date().toISOString().slice(0, 10)) },
    update: {},
    create: {
      fecha: new Date(new Date().toISOString().slice(0, 10)),
      valorVESporUSD: 40,
      fuente: "MANUAL",
      usuarioId: "seed"
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
