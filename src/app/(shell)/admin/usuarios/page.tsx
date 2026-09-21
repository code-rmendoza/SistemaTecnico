"use client";

import { useEffect, useState } from "react";
import { Button, Card, EmptyState, Field, Page, PageHeader, inputCls } from "@/components/ui";
import { SkeletonTable } from "@/components/skeleton";
import { Pagination } from "@/components/pagination";
import { useToast } from "@/components/toast";
import { cn } from "@/components/cn";

const PER_PAGE = 10;

interface Usuario {
  id: string;
  email: string;
  rol: string;
  nombre: string;
}

const ROLES = ["admin", "recepcion", "tecnico", "cliente"];

const ROL_COLORS: Record<string, string> = {
  admin: "bg-purple-50 text-purple-700 ring-purple-200",
  recepcion: "bg-sky-50 text-sky-700 ring-sky-200",
  tecnico: "bg-amber-50 text-amber-700 ring-amber-200",
  cliente: "bg-slate-100 text-slate-600 ring-slate-200",
};

export default function UsuariosPage() {
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("tecnico");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [resetId, setResetId] = useState<string | null>(null);
  const [nuevaClave, setNuevaClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  async function cargar() {
    setLoading(true);
    const res = await fetch("/api/usuarios");
    if (res.ok) setUsuarios((await res.json()).usuarios);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  const paginados = usuarios.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, rol, nombre, password })
    });
    const d = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = d?.error ?? "No se pudo crear";
      setError(msg);
      toast(msg, "error");
      return;
    }
    setEmail("");
    setNombre("");
    setPassword("");
    toast(`Usuario ${d.usuario.email} creado`, "success");
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
      const msg = (await res.json().catch(() => null))?.error ?? "No se pudo guardar";
      setError(msg);
      toast(msg, "error");
      return;
    }
    toast("Rol actualizado", "success");
    cargar();
  }

  async function resetClave(e: React.FormEvent) {
    e.preventDefault();
    if (!resetId) return;
    setError(null);
    const res = await fetch(`/api/usuarios/${resetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: nuevaClave })
    });
    if (!res.ok) {
      const msg = (await res.json().catch(() => null))?.error ?? "No se pudo resetear";
      setError(msg);
      toast(msg, "error");
      return;
    }
    setResetId(null);
    setNuevaClave("");
    toast("Clave actualizada", "success");
  }

  return (
    <Page wide>
      <PageHeader title="Usuarios" sub={`${usuarios.length} cuentas registradas`} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Crear usuario</h2>
          <form onSubmit={crear} className="flex flex-col gap-3">
            <Field id="email" label="Email">
              <input id="email" className={inputCls} type="email" placeholder="usuario@taller.ve" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="rol" label="Rol">
                <select id="rol" className={inputCls} value={rol} onChange={(e) => setRol(e.target.value)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field id="nombre" label="Nombre">
                <input id="nombre" className={inputCls} placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
              </Field>
            </div>
            <Field id="password" label="Clave inicial (mín. 8)">
              <input id="password" className={inputCls} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </Field>
            <Button>Crear usuario</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Cuentas</h2>
          {loading ? (
            <SkeletonTable rows={4} cols={4} />
          ) : usuarios.length === 0 ? (
            <EmptyState>No hay usuarios registrados.</EmptyState>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                      <th className="px-4 py-3">Rol</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginados.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{u.nombre}</p>
                          <p className="text-xs text-slate-500 sm:hidden">{u.email}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{u.email}</td>
                        <td className="px-4 py-3">
                          <select
                            className={cn("rounded-lg border-0 px-2 py-1 text-xs font-semibold ring-1 ring-inset", ROL_COLORS[u.rol] ?? "bg-slate-100 text-slate-600 ring-slate-200")}
                            value={u.rol}
                            onChange={(e) => cambiarRol(u.id, e.target.value)}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {resetId === u.id ? (
                            <form onSubmit={resetClave} className="flex items-center gap-2 justify-end">
                              <input
                                className={cn(inputCls, "w-36")}
                                type="password"
                                placeholder="Nueva clave"
                                value={nuevaClave}
                                onChange={(e) => setNuevaClave(e.target.value)}
                                required
                                minLength={8}
                                autoFocus
                              />
                              <Button type="submit" className="py-1 px-2 text-xs">OK</Button>
                              <button type="button" onClick={() => { setResetId(null); setNuevaClave(""); }} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
                            </form>
                          ) : (
                            <button onClick={() => setResetId(u.id)} className="text-xs font-medium text-emerald-700 hover:text-emerald-800 underline">
                              Reset clave
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} total={usuarios.length} perPage={PER_PAGE} onPageChange={setPage} />
            </>
          )}
        </Card>
      </div>
    </Page>
  );
}
