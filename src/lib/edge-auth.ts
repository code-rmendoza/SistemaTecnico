const ROLES = ["admin", "recepcion", "tecnico", "cliente"] as const;
export type EdgeRole = (typeof ROLES)[number];

export interface EdgeSession {
  sub: string;
  rol: EdgeRole;
}

function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function timingEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Verifica JWT HS256 con WebCrypto. Funciona en Edge runtime y Node. */
export async function verifySessionEdge(token: string, secret: string): Promise<EdgeSession> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Token malformado");
  const [headerB64, payloadB64, sigB64] = parts;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = b64urlDecode(sigB64);
  const ok = await crypto.subtle.verify("HMAC", key, sig, data);
  if (!ok) throw new Error("Firma inválida");

  const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64))) as {
    sub?: unknown;
    rol?: unknown;
    exp?: unknown;
  };
  if (typeof payload.sub !== "string" || !payload.sub) throw new Error("Sin sub");
  if (!ROLES.includes(payload.rol as EdgeRole)) throw new Error("Rol inválido");
  if (typeof payload.exp === "number" && Date.now() / 1000 > payload.exp) {
    throw new Error("Sesión vencida");
  }
  return { sub: payload.sub, rol: payload.rol as EdgeRole };
}
