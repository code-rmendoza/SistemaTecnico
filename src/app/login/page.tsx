"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Field, inputCls } from "@/components/ui";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white text-xl font-bold shadow-lg shadow-emerald-600/30">
            ST
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sistema Técnico</h1>
          <p className="mt-1 text-sm text-slate-400">Taller Electrónica — Venezuela</p>
        </div>

        <Card className="border-slate-700/50 bg-white/95 shadow-xl backdrop-blur">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field id="email" label="Email">
              <input
                id="email"
                className={inputCls}
                type="email"
                placeholder="tu@taller.ve"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </Field>
            <Field id="clave" label="Contraseña">
              <input
                id="clave"
                className={inputCls}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </Field>
            {error && <Alert>{error}</Alert>}
            <Button disabled={loading} className="w-full">
              {loading ? "Entrando…" : "Iniciar sesión"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-500">
          Consulta de órdenes pública en{" "}
          <a href="/portal" className="text-emerald-400 hover:text-emerald-300 underline">Portal del cliente</a>
        </p>
      </div>
    </div>
  );
}
