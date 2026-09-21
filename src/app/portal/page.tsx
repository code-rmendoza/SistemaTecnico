"use client";

import { useState } from "react";
import { Alert, Button, Card, Field, Notice, Page, PageHeader, inputCls } from "@/components/ui";

interface Resultado {
  codigo: string;
  estado: string;
  falla: string;
  fechaPromesa: string | null;
}

export default function PortalPage() {
  const [codigo, setCodigo] = useState("");
  const [identidad, setIdentidad] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResultado(null);
    setLoading(true);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, identidad })
      });
      if (!res.ok) {
        // Error genérico a propósito: no revela si falló código o identidad.
        setError("Orden no encontrada");
        return;
      }
      setResultado(await res.json());
    } catch {
      setError("Orden no encontrada");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <PageHeader title="Consultar estado" sub="Ingresa código OT + cédula o teléfono." />
      <Card>
        <form onSubmit={buscar} className="flex flex-col gap-3">
          <Field id="codigo" label="Código de orden">
            <input id="codigo" className={inputCls} placeholder="OT-2026-0001" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
          </Field>
          <Field id="identidad" label="Cédula o teléfono">
            <input id="identidad" className={inputCls} placeholder="cédula o teléfono" value={identidad} onChange={(e) => setIdentidad(e.target.value)} required />
          </Field>
          <Button disabled={loading}>{loading ? "Buscando…" : "Consultar"}</Button>
        </form>
      </Card>
      {error && <Alert>{error}</Alert>}
      {resultado && (
        <Card className="mt-3 border-emerald-200 bg-emerald-50">
          <Notice>
            <strong>{resultado.codigo}</strong> — {resultado.estado}
          </Notice>
          <p className="text-sm text-stone-600">{resultado.falla}</p>
          {resultado.fechaPromesa && <p className="text-sm text-stone-500">Promesa: {String(resultado.fechaPromesa).slice(0, 10)}</p>}
        </Card>
      )}
    </Page>
  );
}
