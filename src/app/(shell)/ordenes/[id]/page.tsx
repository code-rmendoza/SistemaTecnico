"use client";

import { useEffect, useState, useRef } from "react";
import { Alert, Button, Card, EstadoBadge, Field, Page, inputCls } from "@/components/ui";
import { cn } from "@/components/cn";
import { useToast } from "@/components/toast";

interface Tecnico {
  id: string;
  nombre: string;
  email: string;
}

interface Foto {
  id: string;
  url: string;
  tipo: string;
  nota: string | null;
  creadoEn: string;
}

interface Orden {
  id: string;
  codigo: string;
  estado: string;
  fallaDeclarada: string;
  diagnostico: string | null;
  prioridad: string;
  tecnicoId: string | null;
  historial: { de: string; a: string; usuario: string; fecha: string }[];
  presupuesto: {
    manoObraUSD: number;
    tasaRef: number;
    totalUSDRef: number;
    totalVES: number;
    aprobada: boolean;
    items?: { sku: string; cantidad: number; precioUSD: number }[];
  } | null;
}

const SIGUIENTES: Record<string, string[]> = {
  INGRESADA: ["DIAGNOSTICO", "CANCELADA"],
  DIAGNOSTICO: ["PRESUPUESTADA", "CANCELADA"],
  PRESUPUESTADA: ["APROBADA", "CANCELADA"],
  APROBADA: ["EN_REPARACION", "CANCELADA"],
  EN_REPARACION: ["CONTROL_CALIDAD"],
  CONTROL_CALIDAD: ["LISTA_ENTREGA", "EN_REPARACION"],
  LISTA_ENTREGA: ["ENTREGADA"]
};

const FOTO_TIPOS = [
  { value: "equipo", label: "Equipo" },
  { value: "dano", label: "Daño" },
  { value: "reparacion", label: "Reparación" },
  { value: "otro", label: "Otro" },
];

type Tab = "transiciones" | "presupuesto" | "fotos" | "historial";

export default function OrdenDetalle({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const [orden, setOrden] = useState<Orden | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("transiciones");
  const [manoObra, setManoObra] = useState("20");
  const [tasa, setTasa] = useState("40");
  const [repuestos, setRepuestos] = useState<{ sku: string; cantidad: number; precioUSD: number }[]>([]);
  const [sku, setSku] = useState("");
  const [cant, setCant] = useState("1");
  const [precio, setPrecio] = useState("");

  // Técnicos
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [tecnicoId, setTecnicoId] = useState<string>("");
  const [asignando, setAsignando] = useState(false);

  // Fotos
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [fotoTipo, setFotoTipo] = useState("equipo");
  const [fotoNota, setFotoNota] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [subiendoFile, setSubiendoFile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function cargar() {
    const res = await fetch(`/api/ordenes/${params.id}`);
    if (!res.ok) {
      setError("Orden no encontrada");
      return;
    }
    const data = await res.json();
    setOrden(data.orden);
    setTecnicoId(data.orden.tecnicoId ?? "");
  }

  async function cargarTecnicos() {
    const res = await fetch("/api/usuarios");
    if (res.ok) {
      const data = await res.json();
      setTecnicos(data.usuarios.filter((u: { rol: string }) => u.rol === "tecnico"));
    }
  }

  async function cargarFotos() {
    const res = await fetch(`/api/ordenes/${params.id}/fotos`);
    if (res.ok) setFotos((await res.json()).fotos);
  }

  useEffect(() => {
    cargar();
    cargarTecnicos();
    cargarFotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function asignarTecnico() {
    if (!tecnicoId) return;
    setAsignando(true);
    setError(null);
    const res = await fetch(`/api/ordenes/${params.id}/asignar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tecnicoId }),
    });
    if (!res.ok) {
      const msg = (await res.json().catch(() => null))?.error ?? "No se pudo asignar";
      setError(msg);
      toast(msg, "error");
    } else {
      toast("Técnico asignado", "success");
      cargar();
    }
    setAsignando(false);
  }

  async function transicionar(a: string) {
    setError(null);
    const res = await fetch(`/api/ordenes/${params.id}/transicion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a })
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Transición rechazada");
      return;
    }
    setOrden((await res.json()).orden);
    toast(`Estado → ${a.replace(/_/g, " ")}`, "success");
  }

  async function presupuestar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/ordenes/${params.id}/presupuesto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manoObraUSD: Number(manoObra),
        repuestos,
        tasaRef: Number(tasa),
        validezDias: 7
      })
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "No se pudo presupuestar");
      return;
    }
    toast("Presupuesto creado", "success");
    cargar();
  }

  async function aprobar() {
    setError(null);
    const res = await fetch(`/api/ordenes/${params.id}/presupuesto`, { method: "PUT" });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "No se pudo aprobar");
      return;
    }
    toast("Presupuesto aprobado", "success");
    setOrden((await res.json()).orden);
  }

  async function agregarFotoUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!fotoUrl.trim()) return;
    setSubiendoFoto(true);
    const res = await fetch(`/api/ordenes/${params.id}/fotos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: fotoUrl.trim(), tipo: fotoTipo, nota: fotoNota.trim() || undefined }),
    });
    if (res.ok) {
      toast("Foto agregada", "success");
      setFotoUrl("");
      setFotoNota("");
      cargarFotos();
    } else {
      toast("Error al agregar foto", "error");
    }
    setSubiendoFoto(false);
  }

  async function subirArchivo(file: File) {
    setSubiendoFile(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res = await fetch(`/api/ordenes/${params.id}/fotos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: base64, tipo: fotoTipo, nota: fotoNota.trim() || undefined }),
      });
      if (res.ok) {
        toast("Foto subida", "success");
        setFotoNota("");
        cargarFotos();
      } else {
        toast("Error al subir foto", "error");
      }
      setSubiendoFile(false);
    };
    reader.readAsDataURL(file);
  }

  async function eliminarFoto(fotoId: string) {
    const res = await fetch(`/api/ordenes/${params.id}/fotos?fotoId=${fotoId}`, { method: "DELETE" });
    if (res.ok) {
      toast("Foto eliminada", "info");
      cargarFotos();
    }
  }

  if (error && !orden)
    return (
      <Page>
        <Alert>{error}</Alert>
      </Page>
    );
  if (!orden)
    return (
      <Page>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Cargando…
        </div>
      </Page>
    );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "transiciones", label: "Flujo", icon: <IconArrow className="h-4 w-4" /> },
    { id: "presupuesto", label: "Presupuesto", icon: <IconDoc className="h-4 w-4" /> },
    { id: "fotos", label: `Fotos (${fotos.length})`, icon: <IconCam className="h-4 w-4" /> },
    { id: "historial", label: "Historial", icon: <IconClock className="h-4 w-4" /> },
  ];

  return (
    <Page wide>
      <a className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800 font-medium" href="/ordenes">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Órdenes
      </a>

      {/* Header */}
      <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{orden.codigo}</h1>
            <EstadoBadge estado={orden.estado} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {orden.fallaDeclarada} · <span className="font-medium">{orden.prioridad}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(SIGUIENTES[orden.estado] ?? []).map((s) => (
            <Button
              key={s}
              variant={s === "CANCELADA" ? "danger" : "primary"}
              onClick={() => transicionar(s)}
            >
              {s === "CANCELADA" ? "Cancelar" : `→ ${s.replace(/_/g, " ")}`}
            </Button>
          ))}
        </div>
      </div>
      {error && <Alert>{error}</Alert>}

      {/* Asignar técnico */}
      <Card className="mt-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Asignar técnico</h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Field id="tecnico" label="Técnico">
              <select
                id="tecnico"
                className={inputCls}
                value={tecnicoId}
                onChange={(e) => setTecnicoId(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre} ({t.email})</option>
                ))}
              </select>
            </Field>
          </div>
          <Button
            variant="outline"
            onClick={asignarTecnico}
            disabled={asignando || tecnicoId === (orden.tecnicoId ?? "")}
            className="mb-0.5"
          >
            {asignando ? "Guardando…" : "Asignar"}
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2",
              tab === t.id
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4 animate-fade-in">
        {tab === "transiciones" && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Estado actual</h3>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <IconCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{orden.estado.replace(/_/g, " ")}</p>
                <p className="text-xs text-slate-500">Estado actual de la orden</p>
              </div>
            </div>
          </Card>
        )}

        {tab === "presupuesto" && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Presupuesto</h3>
            {orden.presupuesto ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Mano de obra</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{String(orden.presupuesto.manoObraUSD)} USD</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Tasa</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{String(orden.presupuesto.tasaRef)} Bs</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total</p>
                    <p className="mt-1 text-lg font-bold text-emerald-700">{String(orden.presupuesto.totalVES)} Bs</p>
                  </div>
                </div>
                {(orden.presupuesto.items ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Repuestos</p>
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          <tr>
                            <th className="px-3 py-2">SKU</th>
                            <th className="px-3 py-2 text-right">Cant.</th>
                            <th className="px-3 py-2 text-right">Precio</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(orden.presupuesto.items ?? []).map((r, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 font-medium text-slate-900">{r.sku}</td>
                              <td className="px-3 py-2 text-right text-slate-600">{r.cantidad}</td>
                              <td className="px-3 py-2 text-right text-slate-600">{String(r.precioUSD)} USD</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <span className="text-sm text-slate-600">Estado:</span>
                  <span className={cn("badge-pill", orden.presupuesto.aprobada ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200")}>
                    {orden.presupuesto.aprobada ? "Aprobado" : "Pendiente"}
                  </span>
                </div>
                {!orden.presupuesto.aprobada && orden.estado === "PRESUPUESTADA" && (
                  <Button onClick={aprobar} className="w-full">Aprobar presupuesto</Button>
                )}
              </div>
            ) : (
              <form onSubmit={presupuestar} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="mo" label="Mano de obra (USD)">
                    <input id="mo" className={inputCls} value={manoObra} onChange={(e) => setManoObra(e.target.value)} placeholder="20" inputMode="decimal" />
                  </Field>
                  <Field id="tasa" label="Tasa (Bs/USD)">
                    <input id="tasa" className={inputCls} value={tasa} onChange={(e) => setTasa(e.target.value)} placeholder="40" inputMode="decimal" />
                  </Field>
                </div>
                <div className="grid grid-cols-[1fr_80px_100px_auto] gap-2 items-end">
                  <Field id="sku" label="Repuesto SKU">
                    <input id="sku" className={inputCls} value={sku} onChange={(e) => setSku(e.target.value)} placeholder="REP-0001" />
                  </Field>
                  <Field id="cant" label="Cant.">
                    <input id="cant" className={inputCls} value={cant} onChange={(e) => setCant(e.target.value)} inputMode="numeric" />
                  </Field>
                  <Field id="precio" label="Precio USD">
                    <input id="precio" className={inputCls} value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0.00" inputMode="decimal" />
                  </Field>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!sku || !precio) return;
                      setRepuestos((r) => [...r, { sku, cantidad: Number(cant) || 1, precioUSD: Number(precio) }]);
                      setSku("");
                      setCant("1");
                      setPrecio("");
                    }}
                    className="mb-0.5"
                  >
                    + Agregar
                  </Button>
                </div>
                {repuestos.length > 0 && (
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        <tr>
                          <th className="px-3 py-2">SKU</th>
                          <th className="px-3 py-2 text-right">Cant.</th>
                          <th className="px-3 py-2 text-right">Precio</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {repuestos.map((r, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 font-medium text-slate-900">{r.sku}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{r.cantidad}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{r.precioUSD} USD</td>
                            <td className="px-3 py-2 text-right">
                              <button type="button" onClick={() => setRepuestos((prev) => prev.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <Button>Presupuestar</Button>
              </form>
            )}
          </Card>
        )}

        {tab === "fotos" && (
          <div className="space-y-4">
            {/* Subir foto */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Agregar foto</h3>
              <form onSubmit={agregarFotoUrl} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="ftipo" label="Tipo">
                    <select id="ftipo" className={inputCls} value={fotoTipo} onChange={(e) => setFotoTipo(e.target.value)}>
                      {FOTO_TIPOS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field id="fnota" label="Nota (opcional)">
                    <input id="fnota" className={inputCls} value={fotoNota} onChange={(e) => setFotoNota(e.target.value)} placeholder="Ej: daño en pantalla" />
                  </Field>
                </div>
                <Field id="furl" label="URL de la imagen">
                  <input id="furl" className={inputCls} value={fotoUrl} onChange={(e) => setFotoUrl(e.target.value)} placeholder="https://..." />
                </Field>
                <Button type="submit" disabled={subiendoFoto || !fotoUrl.trim()}>
                  {subiendoFoto ? "Agregando…" : "Agregar por URL"}
                </Button>
              </form>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">o</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="mt-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) subirArchivo(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={subiendoFile}
                  className="w-full"
                >
                  {subiendoFile ? "Subiendo…" : "Subir archivo"}
                </Button>
              </div>
            </Card>

            {/* Galería */}
            {fotos.length === 0 ? (
              <Card>
                <p className="text-sm text-slate-500 text-center py-4">Sin fotos aún.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {fotos.map((f) => (
                  <div key={f.id} className="group relative rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                      {f.url.startsWith("data:") ? (
                        <img src={f.url} alt={f.nota ?? "Foto"} className="h-full w-full object-cover" />
                      ) : (
                        <img src={f.url} alt={f.nota ?? "Foto"} className="h-full w-full object-cover" onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                        }} />
                      )}
                      <div className="hidden text-xs text-slate-400 text-center p-2">No se pudo cargar</div>
                    </div>
                    <div className="p-2">
                      <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {FOTO_TIPOS.find((t) => t.value === f.tipo)?.label ?? f.tipo}
                      </span>
                      {f.nota && <p className="mt-1 text-xs text-slate-500 truncate">{f.nota}</p>}
                      <p className="mt-0.5 text-xs text-slate-400">{String(f.creadoEn).slice(0, 10)}</p>
                    </div>
                    <button
                      onClick={() => eliminarFoto(f.id)}
                      className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "historial" && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Historial de cambios</h3>
            {orden.historial.length === 0 ? (
              <p className="text-sm text-slate-500">Sin movimientos registrados.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
                <ol className="space-y-4">
                  {orden.historial.map((h, i) => (
                    <li key={i} className="relative flex gap-4 pl-9">
                      <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-emerald-500 bg-white" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {h.de.replace(/_/g, " ")} → {h.a.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {h.usuario} · {String(h.fecha).slice(0, 16).replace("T", " ")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Card>
        )}
      </div>
    </Page>
  );
}

/* ── Icons ── */

function IconArrow({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

function IconDoc({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function IconCam({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}
