import { describe, expect, it } from "vitest";
import { authorize, signSession, verifyPassword, hashPassword, verifySession } from "@/lib/auth";

describe("auth lib", () => {
  it("hashea y verifica password", async () => {
    const hash = await hashPassword("Clave123");
    expect(hash).not.toBe("Clave123");
    await expect(verifyPassword("Clave123", hash)).resolves.toBe(true);
    await expect(verifyPassword("otra", hash)).resolves.toBe(false);
  });

  it("firma y verifica sesión con rol", () => {
    const token = signSession({ sub: "u1", rol: "tecnico" }, "test-secret");
    const payload = verifySession(token, "test-secret");
    expect(payload.sub).toBe("u1");
    expect(payload.rol).toBe("tecnico");
  });

  it("rechaza token inválido", () => {
    expect(() => verifySession("invalido", "test-secret")).toThrow();
  });

  it("autoriza por rol", () => {
    expect(authorize("admin", ["admin"])).toBe(true);
    expect(authorize("tecnico", ["admin"])).toBe(false);
    expect(authorize("cliente", ["cliente"])).toBe(true);
    expect(authorize("recepcion", ["admin", "recepcion"])).toBe(true);
  });
});
