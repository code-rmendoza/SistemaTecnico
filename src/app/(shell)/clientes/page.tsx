"use client";

import { useEffect, useState } from "react";
import { Button, Card, EmptyState, Field, Page, PageHeader, inputCls } from "@/components/ui";
import { SkeletonCard } from "@/components/skeleton";
import { Pagination } from "@/components/pagination";
import { useToast } from "@/components/toast";
import { cn } from "@/components/cn";

const PER_PAGE = 10;

interface Equipo {
  id: string;
  tipo: string;
  marca: string;
  modelo: string;
}

interface Cliente {
  id: string;
  nombre: string;
  cedulaRif: string;
  telefono: string;
  equipos: Equipo[];
}

export default function ClientesPage() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [equipoCli, setEquipoCli] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTelefono, setEditTelefono] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  async function cargar(busqueda = "") {
    setLoading(true);
    const res = await fetch(`/api/clientes?q=${encodeURIComponent(busqueda)}`);
    if (res.ok) setClientes((await res.json()).clientes);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); cargar(q); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const paginados = clientes.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  async function crearCliente(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, cedulaRif: cedula, telefono })
    });
    if (!res.ok) {
      const msg = (await res.json().catch(() => null))?.error ?? "No se pudo crear";
      setError(msg);
      toast(msg, "error");
      return;
    }
    setNombre("");
    setCedula("");
    setTelefono("");
    toast("Cliente creado", "success");
    cargar(q);
  }

  async function guardarTelefono(id: string) {
    setError(null);
    const res = await fetch(`/api/clientes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefono: editTelefono })
    });
    if (!res.ok) {
      const msg = (await res.json().catch(() => null))?.error ?? "No se pudo guardar";
      setError(msg);
      toast(msg, "error");
      return;
    }
    setEditId(null);
    toast("Teléfono actualizado", "success");
    cargar(q);
  }

  async function crearEquipo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/equipos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clienteId: equipoCli, tipo: "celular", marca, modelo })
    });
    if (!res.ok) {
      const msg = (await res.json().catch(() => null))?.error ?? "No se pudo crear el equipo";
      setError(msg);
      toast(msg, "error");
      return;
    }
    setEquipoCli("");
    setMarca("");
    setModelo("");
    toast("Equipo registrado", "success");
    cargar(q);
  }

  return (
    <Page wide>
      <PageHeader title="Clientes" sub={`${clientes.length} clientes registrados`} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Nuevo cliente</h2>
          <form onSubmit={crearCliente} className="flex flex-col gap-3">
            <Field id="nombre" label="Nombre">
              <input id="nombre" className={inputCls} placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
            </Field>
            <Field id="cedula" label="Cédula o RIF">
              <input id="cedula" className={inputCls} placeholder="V-12345678" value={cedula} onChange={(e) => setCedula(e.target.value)} required minLength={5} />
            </Field>
            <Field id="tel" label="Teléfono">
              <input id="tel" className={inputCls} placeholder="0412-1234567" value={telefono} onChange={(e) => setTelefono(e.target.value)} required minLength={7} />
            </Field>
            <Button>Crear cliente</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Nuevo equipo</h2>
          <form onSubmit={crearEquipo} className="flex flex-col gap-3">
            <Field id="eqcli" label="Cliente">
              <select id="eqcli" className={inputCls} value={equipoCli} onChange={(e) => setEquipoCli(e.target.value)} required>
                <option value="">Seleccionar cliente…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} — {c.cedulaRif}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="marca" label="Marca">
                <input id="marca" className={inputCls} placeholder="Samsung" value={marca} onChange={(e) => setMarca(e.target.value)} required />
              </Field>
              <Field id="modelo" label="Modelo">
                <input id="modelo" className={inputCls} placeholder="Galaxy S24" value={modelo} onChange={(e) => setModelo(e.target.value)} required />
              </Field>
            </div>
            <Button>Crear equipo</Button>
          </form>
        </Card>
      </div>

      {/* Búsqueda */}
      <div className="mt-6 relative">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          className={cn(inputCls, "pl-9")}
          placeholder="Buscar por nombre, cédula o teléfono…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : paginados.length === 0 ? (
        <EmptyState>{q ? "No se encontraron resultados." : "Sin clientes registrados."}</EmptyState>
      ) : (
        <>
          <ul className="mt-4 flex flex-col gap-2">
            {paginados.map((c) => (
              <li key={c.id}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{c.nombre}</p>
                      <p className="text-xs text-slate-500">{c.cedulaRif} · {c.telefono}</p>
                      {c.equipos.length > 0 && (
                        <p className="text-xs text-slate-400 mt-1">{c.equipos.map((e) => `${e.marca} ${e.modelo}`).join(", ")}</p>
                      )}
                    </div>
                    {editId === c.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          className={cn(inputCls, "w-32")}
                          value={editTelefono}
                          onChange={(e) => setEditTelefono(e.target.value)}
                          aria-label="Nuevo teléfono"
                        />
                        <Button variant="ghost" onClick={() => guardarTelefono(c.id)} className="py-1 px-2 text-xs">OK</Button>
                        <button className="text-xs text-slate-400 hover:text-slate-600" onClick={() => setEditId(null)}>✕</button>
                      </div>
                    ) : (
                      <button
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                        onClick={() => { setEditId(c.id); setEditTelefono(c.telefono); }}
                      >
                        Editar tel.
                      </button>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          <Pagination page={page} total={clientes.length} perPage={PER_PAGE} onPageChange={setPage} />
        </>
      )}
    </Page>
  );
}
