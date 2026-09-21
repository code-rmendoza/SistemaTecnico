import { describe, expect, it } from "vitest";
import { signSession } from "@/lib/auth";
import { verifySessionEdge } from "@/lib/edge-auth";

const SECRET = "test-secret-min-32-chars-1234567890";

describe("edge-auth (WebCrypto, sin dependencias Node)", () => {
  it("verifica token firmado con jsonwebtoken", async () => {
    const token = signSession({ sub: "u1", rol: "tecnico" }, SECRET);
    const payload = await verifySessionEdge(token, SECRET);
    expect(payload.rol).toBe("tecnico");
  });

  it("rechaza firma inválida", async () => {
    const token = signSession({ sub: "u1", rol: "admin" }, SECRET);
    const tampered = token.slice(0, -2) + "xx";
    await expect(verifySessionEdge(tampered, SECRET)).rejects.toThrow();
  });

  it("rechaza token malformado", async () => {
    await expect(verifySessionEdge("invalido", SECRET)).rejects.toThrow();
  });
});
