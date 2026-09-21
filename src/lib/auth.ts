import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

export const Role = z.enum(["admin", "recepcion", "tecnico", "cliente"]);
export type Role = z.infer<typeof Role>;

const SessionPayload = z.object({
  sub: z.string().min(1),
  rol: Role
});
export type SessionPayload = z.infer<typeof SessionPayload>;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signSession(payload: SessionPayload, secret: string): string {
  return jwt.sign(SessionPayload.parse(payload), secret, { expiresIn: "8h" });
}

export function verifySession(token: string, secret: string): SessionPayload {
  return SessionPayload.parse(jwt.verify(token, secret));
}

export function authorize(role: Role, allowed: Role[]): boolean {
  return allowed.includes(role);
}
