/**
 * Crea o actualiza un usuario para login (solo ejecutar con acceso a la DB).
 *
 * Uso:
 *   DATABASE_URL="..." npx tsx scripts/users-create.ts --email dueno@taller.ve --rol admin --nombre "Dueño"
 *   DATABASE_URL="..." npx tsx scripts/users-create.ts --email tec@taller.ve --rol tecnico --nombre "Técnico" --password "clave-segura-123"
 *
 * Sin --password genera una aleatoria y la imprime UNA vez (anótala).
 */
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const Args = z.object({
  email: z.string().email(),
  rol: z.enum(["admin", "recepcion", "tecnico", "cliente"]),
  nombre: z.string().min(2),
  password: z.string().min(8).optional()
});

function parseArgs(argv: string[]): z.infer<typeof Args> {
  const map: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, "");
    const value = argv[i + 1];
    if (key && value !== undefined) map[key] = value;
  }
  return Args.parse({
    ...map,
    password: map["password"] ?? randomBytes(12).toString("base64url")
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(args.password as string, 12);
    const user = await prisma.usuario.upsert({
      where: { email: args.email.toLowerCase() },
      update: { passwordHash, rol: args.rol, nombre: args.nombre },
      create: {
        email: args.email.toLowerCase(),
        passwordHash,
        rol: args.rol,
        nombre: args.nombre
      }
    });
    console.log(`OK: ${user.email} (${user.rol})`);
    if (!process.argv.includes("--password")) {
      console.log(`CLAVE (única vez): ${args.password}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
