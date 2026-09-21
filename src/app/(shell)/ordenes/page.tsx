"use client";

import { useEffect, useState } from "react";
import { Button, Card, EmptyState, EstadoBadge, Field, Page, PageHeader, inputCls } from "@/components/ui";
import { SkeletonCard } from "@/components/skeleton";
import { Pagination } from "@/components/pagination";
import { useToast } from "@/components/toast";

const PER_PAGE = 10;

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
  const { toast } = useToast();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [equipoId, setEquipoId] = useState("");
  const [falla, setFalla] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  async function cargar() {
    setLoading(true);
    const [ro, rc] = await Promise.all([fetch("/api/ordenes"), fetch("/api/clientes")]);
    if (ro.ok) setOrdenes((await ro.json()).ordenes);
    if (rc.ok) setClientes((await rc.json()).clientes);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  const equipos = clientes.find((c) => c.id === clienteId)?.equipos ?? [];
  const paginadas = ordenes.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/ordenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clienteId, equipoId, fallaDeclarada: falla })
    });
    if (!res.ok) {
      const msg = (await res.json().catch(() => null))?.error ?? "No se pudo crear";
      setError(msg);
      toast(msg, "error");
      return;
    }
    setClienteId("");
    setEquipoId("");
    setFalla("");
    toast("Orden creada correctamente", "success");
    cargar();
  }

  return (
    <Page wide>
      <PageHeader title="Órdenes" sub={`${ordenes.length} órdenes registradas`} />
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Nueva orden</h2>
        <form onSubmit={crear} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="cli" label="Cliente">
              <select id="cli" className={inputCls} value={clienteId} onChange={(e) => { setClienteId(e.target.value); setEquipoId(""); }} required>
                <option value="">Seleccionar cliente…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} — {c.cedulaRif}</option>
                ))}
              </select>
            </Field>
            <Field id="eq" label="Equipo">
              <select id="eq" className={inputCls} value={equipoId} onChange={(e) => setEquipoId(e.target.value)} required>
                <option value="">Seleccionar equipo…</option>
                {equipos.map((q) => (
                  <option key={q.id} value={q.id}>{q.marca} {q.modelo}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field id="falla" label="Falla declarada">
            <input id="falla" className={inputCls} placeholder="Descripción de la falla" value={falla} onChange={(e) => setFalla(e.target.value)} required minLength={3} />
          </Field>
          <Button>Crear OT</Button>
        </form>
      </Card>

      {loading ? (
        <div className="mt-4 space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : paginadas.length === 0 ? (
        <EmptyState>Sin órdenes todavía.</EmptyState>
      ) : (
        <>
          <ul className="mt-4 flex flex-col gap-2">
            {paginadas.map((o) => (
              <li key={o.id}>
                <a href={`/ordenes/${o.id}`}>
                  <Card className="transition-all hover:border-emerald-400 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{o.codigo}</p>
                        <p className="text-sm text-slate-500">{o.equipo.marca} {o.equipo.modelo} · {o.equipo.cliente.nombre}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{o.fallaDeclarada}</p>
                      </div>
                      <EstadoBadge estado={o.estado} />
                    </div>
                  </Card>
                </a>
              </li>
            ))}
          </ul>
          <Pagination page={page} total={ordenes.length} perPage={PER_PAGE} onPageChange={setPage} />
        </>
      )}
    </Page>
  );
}
