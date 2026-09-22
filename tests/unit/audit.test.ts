import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => ({
    auditLog: { create: mockCreate },
  })),
}));

describe("auditLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({});
  });

  it("registra una acción correctamente", async () => {
    const { auditLog } = await import("@/lib/audit");
    await auditLog({
      usuarioId: "user@test.com",
      accion: "LOGIN_OK",
      recurso: "auth",
      ip: "127.0.0.1",
    });
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        usuarioId: "user@test.com",
        accion: "LOGIN_OK",
        recurso: "auth",
        recursoId: undefined,
        detalles: undefined,
        ip: "127.0.0.1",
      },
    });
  });

  it("no lanza error si falla el write", async () => {
    mockCreate.mockRejectedValue(new Error("DB down"));
    const { auditLog } = await import("@/lib/audit");
    await expect(
      auditLog({ usuarioId: "x", accion: "TEST", recurso: "test" })
    ).resolves.toBeUndefined();
  });
});
