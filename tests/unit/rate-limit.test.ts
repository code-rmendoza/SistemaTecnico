import { describe, it, expect, vi } from "vitest";

describe("rateLimit", () => {
  it("permite requests dentro del límite", async () => {
    vi.useFakeTimers();
    const { rateLimit } = await import("@/lib/rate-limit");

    expect(rateLimit({ clave: "test1", max: 3, ventanaMs: 60_000 })).toBe(true);
    expect(rateLimit({ clave: "test1", max: 3, ventanaMs: 60_000 })).toBe(true);
    expect(rateLimit({ clave: "test1", max: 3, ventanaMs: 60_000 })).toBe(true);
    expect(rateLimit({ clave: "test1", max: 3, ventanaMs: 60_000 })).toBe(false);
    vi.useRealTimers();
  });

  it("resetea después de la ventana", async () => {
    vi.useFakeTimers();
    const { rateLimit } = await import("@/lib/rate-limit");

    expect(rateLimit({ clave: "test2", max: 1, ventanaMs: 1000 })).toBe(true);
    expect(rateLimit({ clave: "test2", max: 1, ventanaMs: 1000 })).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rateLimit({ clave: "test2", max: 1, ventanaMs: 1000 })).toBe(true);
    vi.useRealTimers();
  });

  it("claves independientes", async () => {
    vi.useFakeTimers();
    const { rateLimit } = await import("@/lib/rate-limit");

    expect(rateLimit({ clave: "a", max: 1, ventanaMs: 60_000 })).toBe(true);
    expect(rateLimit({ clave: "a", max: 1, ventanaMs: 60_000 })).toBe(false);
    expect(rateLimit({ clave: "b", max: 1, ventanaMs: 60_000 })).toBe(true);
    vi.useRealTimers();
  });
});
