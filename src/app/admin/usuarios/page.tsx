"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Field, Notice, Page, PageHeader, inputCls } from "@/components/ui";

interface Usuario {
  id: string;
  email: string;
  rol: string;
  nombre: string;
}

const ROLES = ["admin", "recepcion", "tecnico", "cliente"];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("tecnico");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [resetId, setResetId] = useState<string | null>(null);
  const [nuevaClave, setNuevaClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function cargar() {
    const res = await fetch("/api/usuarios");
    if (res.ok) setUsuarios((await res.json()).usuarios);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, rol, nombre, password })
    });
    const d = await res.json().catch(() => null);
    if (!res.ok) {
      setError(d?.error ?? "No se pudo crear");
      return;
    }
    setEmail("");
    setNombre("");
    setPassword("");
    setMsg(`Usuario ${d.usuario.email} creado`);
    cargar();
  }

  async function cambiarRol(id: string, nuevo: string) {
    setError(null);
    const res = await fetch(`/api/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rol: nuevo })
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "No se pudo guardar");
      return;
    }
    cargar();
  }

  async function resetClave(e: React.FormEvent) {
    e.preventDefault();
    if (!resetId) return;
    setError(null);
    setMsg(null);
    const res = await fetch(`/api/usuarios/${resetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: nuevaClave })
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "No se pudo resetear");
      return;
    }
    setResetId(null);
    setNuevaClave("");
    setMsg("Clave actualizada");
  }

  return (
    <Page wide>
      <PageHeader title="Usuarios" sub="Solo admin. Crea cuentas, cambia roles y resetea claves." />
      {error && <Alert>{error}</Alert>}
      {msg && <Notice>{msg}</Notice>}

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-bold">Nuevo usuario</h2>
          <form onSubmit={crear} className="flex flex-col gap-2">
            <Field id="email" label="Email">
              <input id="email" className={inputCls} type="email" placeholder="usuario@taller.ve" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field id="rol" label="Rol">
                <select id="rol" className={inputCls} value={rol} onChange={(e) => setRol(e.target.value)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field id="nombre" label="Nombre">
                <input id="nombre" className={inputCls} placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
              </Field>
            </div>
            <Field id="password" label="Clave inicial (mín. 8)">
              <input id="password" className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </Field>
            <Button>Crear usuario</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-2 text-sm font-bold">Cuentas ({usuarios.length})</h2>
          <ul className="flex flex-col gap-2">
            {usuarios.map((u) => (
              <li key={u.id} className="rounded-lg border border-stone-200 p-2 text-sm">
                <p><strong>{u.nombre}</strong> <span className="text-stone-500">· {u.email}</span></p>
                <div className="mt-1 flex items-center gap-2">
                  <label className="sr-only" htmlFor={`rol-${u.id}`}>Rol de {u.email}</label>
                  <select
                    id={`rol-${u.id}`}
                    className="rounded-lg border border-stone-300 px-2 py-1 text-sm"
                    value={u.rol}
                    onChange={(e) => cambiarRol(u.id, e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button className="text-emerald-700 underline" onClick={() => setResetId(u.id)}>
                    reset clave
                  </button>
                </div>
                {resetId === u.id && (
                  <form onSubmit={resetClave} className="mt-2 flex gap-2">
                    <label className="sr-only" htmlFor="nueva">Nueva clave</label>
                    <input
                      id="nueva"
                      className={inputCls}
                      type="password"
                      placeholder="Nueva clave (mín. 8)"
                      value={nuevaClave}
                      onChange={(e) => setNuevaClave(e.target.value)}
                      required
                      minLength={8}
                    />
                    <Button>Guardar</Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Page>
  );
}
