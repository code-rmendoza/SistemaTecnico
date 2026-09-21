"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, EmptyState, Field, Page, PageHeader, inputCls } from "@/components/ui";

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

  async function cargar(busqueda = "") {
    const res = await fetch(`/api/clientes?q=${encodeURIComponent(busqueda)}`);
    if (res.ok) setClientes((await res.json()).clientes);
  }

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => cargar(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  async function crearCliente(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, cedulaRif: cedula, telefono })
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "No se pudo crear");
      return;
    }
    setNombre("");
    setCedula("");
    setTelefono("");
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
      setError((await res.json().catch(() => null))?.error ?? "No se pudo guardar");
      return;
    }
    setEditId(null);
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
      setError((await res.json().catch(() => null))?.error ?? "No se pudo crear el equipo");
      return;
    }
    setEquipoCli("");
    setMarca("");
    setModelo("");
    cargar(q);
  }

  return (
    <Page wide>
      <PageHeader title="Clientes" />
      {error && <Alert>{error}</Alert>}

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-bold">Nuevo cliente</h2>
          <form onSubmit={crearCliente} className="flex flex-col gap-2">
            <Field id="nombre" label="Nombre">
              <input id="nombre" className={inputCls} placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
            </Field>
            <Field id="cedula" label="Cédula o RIF">
              <input id="cedula" className={inputCls} placeholder="Cédula o RIF (V-12345678)" value={cedula} onChange={(e) => setCedula(e.target.value)} required minLength={5} />
            </Field>
            <Field id="tel" label="Teléfono">
              <input id="tel" className={inputCls} placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} required minLength={7} />
            </Field>
            <Button>Crear cliente</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-2 text-sm font-bold">Nuevo equipo</h2>
          <form onSubmit={crearEquipo} className="flex flex-col gap-2">
            <Field id="eqcli" label="Cliente">
              <select id="eqcli" className={inputCls} value={equipoCli} onChange={(e) => setEquipoCli(e.target.value)} required>
                <option value="">Cliente…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} — {c.cedulaRif}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field id="marca" label="Marca">
                <input id="marca" className={inputCls} placeholder="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} required />
              </Field>
              <Field id="modelo" label="Modelo">
                <input id="modelo" className={inputCls} placeholder="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} required />
              </Field>
            </div>
            <Button>Crear equipo</Button>
          </form>
        </Card>
      </div>

      <Field id="buscar-clientes" label="Buscar clientes">
        <input
          id="buscar-clientes"
          className={inputCls}
          placeholder="Buscar por nombre, cédula o teléfono"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </Field>

      {clientes.length === 0 ? (
        <EmptyState>Sin resultados.</EmptyState>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {clientes.map((c) => (
            <li key={c.id}>
              <Card>
                <p className="text-sm">
                  <strong>{c.nombre}</strong> <span className="text-stone-500">— {c.cedulaRif} — </span>
                  {editId === c.id ? (
                    <>
                      <input
                        className="w-32 rounded-lg border border-stone-300 px-2 py-1 text-sm"
                        value={editTelefono}
                        onChange={(e) => setEditTelefono(e.target.value)}
                        aria-label="Nuevo teléfono"
                      />{" "}
                      <button className="text-emerald-700 underline" onClick={() => guardarTelefono(c.id)}>Guardar</button>{" "}
                      <button className="text-stone-400 underline" onClick={() => setEditId(null)}>X</button>
                    </>
                  ) : (
                    <>
                      {c.telefono}{" "}
                      <button className="text-stone-400 underline" onClick={() => { setEditId(c.id); setEditTelefono(c.telefono); }}>
                        editar
                      </button>
                    </>
                  )}
                </p>
                {c.equipos.length > 0 && (
                  <p className="text-sm text-stone-500">· {c.equipos.map((e) => `${e.marca} ${e.modelo}`).join(", ")}</p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
