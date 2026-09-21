"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Field, Page, PageHeader, inputCls } from "@/components/ui";

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
    <Page>
      <PageHeader title="Iniciar sesión" sub="Usa tu cuenta del taller" />
      <Card>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Field id="email" label="Email">
            <input
              id="email"
              className={inputCls}
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field id="clave" label="Clave">
            <input
              id="clave"
              className={inputCls}
              type="password"
              placeholder="clave"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </Field>
          {error && <Alert>{error}</Alert>}
          <Button disabled={loading}>{loading ? "Entrando…" : "Entrar"}</Button>
        </form>
      </Card>
    </Page>
  );
}
