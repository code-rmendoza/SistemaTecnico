"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "No se pudo iniciar sesión");
      return;
    }
    router.push(data?.rol === "cliente" ? "/portal" : "/ordenes");
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-bold">Iniciar sesión</h1>
      <p className="mt-1 text-xs opacity-70">Demo v1: admin@taller.ve / recepcion@taller.ve / tecnico@taller.ve / cliente@taller.ve — clave demo1234</p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        <input
          className="rounded border p-2"
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="rounded border p-2"
          type="password"
          placeholder="clave"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="rounded bg-black p-2 text-white disabled:opacity-50" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
