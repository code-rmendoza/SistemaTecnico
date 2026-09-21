"use client";

import { useEffect, useState } from "react";

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
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold">Clientes</h1>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={crearCliente} className="mt-3 flex flex-col gap-2 rounded border p-3">
        <h2 className="text-sm font-bold">Nuevo cliente</h2>
        <label className="sr-only" htmlFor="nombre">Nombre</label>
        <input id="nombre" className="rounded border p-2" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
        <label className="sr-only" htmlFor="cedula">Cédula o RIF</label>
        <input id="cedula" className="rounded border p-2" placeholder="Cédula o RIF (V-12345678)" value={cedula} onChange={(e) => setCedula(e.target.value)} required minLength={5} />
        <label className="sr-only" htmlFor="tel">Teléfono</label>
        <input id="tel" className="rounded border p-2" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} required minLength={7} />
        <button className="rounded bg-black p-2 text-white">Crear cliente</button>
      </form>

      <form onSubmit={crearEquipo} className="mt-3 flex flex-col gap-2 rounded border p-3">
        <h2 className="text-sm font-bold">Nuevo equipo</h2>
        <label className="sr-only" htmlFor="eqcli">Cliente</label>
        <select id="eqcli" className="rounded border p-2" value={equipoCli} onChange={(e) => setEquipoCli(e.target.value)} required>
          <option value="">Cliente…</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre} — {c.cedulaRif}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="marca">Marca</label>
          <input id="marca" className="w-1/2 rounded border p-2" placeholder="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} required />
          <label className="sr-only" htmlFor="modelo">Modelo</label>
          <input id="modelo" className="w-1/2 rounded border p-2" placeholder="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} required />
        </div>
        <button className="rounded bg-black p-2 text-white">Crear equipo</button>
      </form>

      <label className="sr-only" htmlFor="buscar-clientes">Buscar clientes</label>
      <input
        id="buscar-clientes"
        className="mt-4 w-full rounded border p-2"
        placeholder="Buscar por nombre, cédula o teléfono"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="mt-2 divide-y">
        {clientes.map((c) => (
          <li key={c.id} className="py-2 text-sm">
            <strong>{c.nombre}</strong> — {c.cedulaRif} —{" "}
            {editId === c.id ? (
              <>
                <input
                  className="w-32 rounded border p-1"
                  value={editTelefono}
                  onChange={(e) => setEditTelefono(e.target.value)}
                  aria-label="Nuevo teléfono"
                />{" "}
                <button className="underline" onClick={() => guardarTelefono(c.id)}>Guardar</button>{" "}
                <button className="underline opacity-60" onClick={() => setEditId(null)}>X</button>
              </>
            ) : (
              <>
                {c.telefono}{" "}
                <button className="underline opacity-60" onClick={() => { setEditId(c.id); setEditTelefono(c.telefono); }}>
                  editar
                </button>
              </>
            )}
            {c.equipos.length > 0 && (
              <span className="opacity-70"> · {c.equipos.map((e) => `${e.marca} ${e.modelo}`).join(", ")}</span>
            )}
          </li>
        ))}
      </ul>
      {clientes.length === 0 && <p className="mt-2 text-sm opacity-60">Sin resultados.</p>}
    </main>
  );
}
