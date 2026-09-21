"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, EmptyState, EstadoBadge, Field, Page, PageHeader, inputCls } from "@/components/ui";

interface Cliente {
  id: string;
  nombre: string;
  cedulaRif: string;
  equipos: { id: string; marca: string; modelo: string; tipo: string }[];
}

interface Orden {
  id: string;
  codigo: string;
  estado: string;
  fallaDeclarada: string;
  equipo: { marca: string; modelo: string; cliente: { nombre: string } };
}

export default function OrdenesPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [equipoId, setEquipoId] = useState("");
  const [falla, setFalla] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    const [ro, rc] = await Promise.all([fetch("/api/ordenes"), fetch("/api/clientes")]);
    if (ro.ok) setOrdenes((await ro.json()).ordenes);
    if (rc.ok) setClientes((await rc.json()).clientes);
  }

  useEffect(() => {
    cargar();
  }, []);

  const equipos = clientes.find((c) => c.id === clienteId)?.equipos ?? [];

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/ordenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clienteId, equipoId, fallaDeclarada: falla })
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "No se pudo crear");
      return;
    }
    setClienteId("");
    setEquipoId("");
    setFalla("");
    cargar();
  }

  return (
    <Page wide>
      <PageHeader title="Órdenes" />
      <Card>
        <h2 className="mb-2 text-sm font-bold">Nueva orden</h2>
        <form onSubmit={crear} className="flex flex-col gap-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field id="cli" label="Cliente">
              <select id="cli" className={inputCls} value={clienteId} onChange={(e) => { setClienteId(e.target.value); setEquipoId(""); }} required>
                <option value="">Cliente…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} — {c.cedulaRif}</option>
                ))}
              </select>
            </Field>
            <Field id="eq" label="Equipo">
              <select id="eq" className={inputCls} value={equipoId} onChange={(e) => setEquipoId(e.target.value)} required>
                <option value="">Equipo…</option>
                {equipos.map((q) => (
                  <option key={q.id} value={q.id}>{q.marca} {q.modelo}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field id="falla" label="Falla declarada">
            <input id="falla" className={inputCls} placeholder="Falla declarada" value={falla} onChange={(e) => setFalla(e.target.value)} required minLength={3} />
          </Field>
          {error && <Alert>{error}</Alert>}
          <Button>Crear OT</Button>
        </form>
      </Card>

      {ordenes.length === 0 ? (
        <EmptyState>Sin órdenes todavía.</EmptyState>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {ordenes.map((o) => (
            <li key={o.id}>
              <a href={`/ordenes/${o.id}`}>
                <Card className="transition-colors hover:border-emerald-600">
                  <p className="text-sm">
                    <strong>{o.codigo}</strong> <EstadoBadge estado={o.estado} />
                  </p>
                  <p className="text-sm text-stone-500">{o.equipo.marca} {o.equipo.modelo} · {o.equipo.cliente.nombre} · {o.fallaDeclarada}</p>
                </Card>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
