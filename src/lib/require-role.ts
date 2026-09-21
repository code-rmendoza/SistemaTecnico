import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { verifySession } from "./auth";

type Role = "admin" | "recepcion" | "tecnico" | "cliente";

/** Exige uno de los roles; sin sesión/token inválido redirige a /login, sin rol responde 404 (no filtra). */
export function requireRole(allowed: Role[]): { sub: string; rol: Role } {
  const token = cookies().get("session")?.value;
  if (!token) redirect("/login");
  let payload: { sub: string; rol: Role };
  try {
    const secret = process.env.JWT_SECRET ?? "dev-secret-solo-local";
    payload = verifySession(token, secret);
  } catch {
    redirect("/login");
  }
  if (!allowed.includes(payload.rol)) notFound();
  return payload;
}
