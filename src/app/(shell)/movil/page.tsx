"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, EmptyState, EstadoBadge, Page, PageHeader } from "@/components/ui";

interface OrdenMovil {
  id: string;
  codigo: string;
  estado: string;
  fallaDeclarada: string;
  prioridad: string;
  equipo: { tipo: string; marca: string; modelo: string };
}

const SIGUIENTES_TECH: Record<string, string[]> = {
  APROBADA: ["EN_REPARACION"],
  EN_REPARACION: ["CONTROL_CALIDAD"],
  CONTROL_CALIDAD: ["LISTA_ENTREGA", "EN_REPARACION"],
};

export default function MovilPage() {
  const [ordenes, setOrdenes] = useState<OrdenMovil[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function cargar() {
    setLoading(true);
    const res = await fetch("/api/movil");
    if (res.ok) {
      setOrdenes((await res.json()).ordenes);
    } else {
      setError("No se pudieron cargar las órdenes");
    }
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function avanzar(id: string, accion: string) {
    setError(null);
    const res = await fetch(`/api/ordenes/${id}/transicion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a: accion }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Transición rechazada");
      return;
    }
    cargar();
  }

  return (
    <Page wide>
      <PageHeader title="Mi cola de trabajo" sub="Órdenes asignadas que necesitan atención." />
      {error && <Alert>{error}</Alert>}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-8">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Cargando órdenes…
        </div>
      ) : ordenes.length === 0 ? (
        <EmptyState>No hay órdenes asignadas por ahora.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordenes.map((o) => {
            const acciones = SIGUIENTES_TECH[o.estado] ?? [];
            return (
              <Card key={o.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{o.codigo}</p>
                    <p className="text-xs text-slate-500">{o.equipo.marca} {o.equipo.modelo}</p>
                  </div>
                  <EstadoBadge estado={o.estado} />
                </div>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">{o.fallaDeclarada}</p>
                <div className="mt-auto pt-3 flex gap-2">
                  {acciones.map((a) => (
                    <Button
                      key={a}
                      variant={a === "EN_REPARACION" ? "primary" : "outline"}
                      onClick={() => avanzar(o.id, a)}
                      className="flex-1"
                    >
                      {a === "EN_REPARACION" ? "🔧 Reparar" : a === "CONTROL_CALIDAD" ? "✓ Control" : "→ Entregar"}
                    </Button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}
