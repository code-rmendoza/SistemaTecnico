import { Card, Page } from "@/components/ui";

const LINKS = [
  { href: "/ordenes", titulo: "Órdenes", desc: "Crear, diagnosticar, presupuestar y entregar" },
  { href: "/clientes", titulo: "Clientes", desc: "Alta, búsqueda y equipos" },
  { href: "/inventario", titulo: "Inventario", desc: "Repuestos y movimientos" },
  { href: "/caja", titulo: "Caja", desc: "Tasa, cobros y cierre dual" },
  { href: "/movil", titulo: "Móvil técnicos", desc: "Cola asignada" },
  { href: "/portal", titulo: "Portal cliente", desc: "Consulta por código (público)" },
  { href: "/admin/reportes", titulo: "Reportes", desc: "Ingresos y cuentas por cobrar (admin)" },
  { href: "/admin/usuarios", titulo: "Usuarios", desc: "Cuentas, roles y claves (admin)" }
];

export default function Home() {
  return (
    <Page wide>
      <h1 className="text-2xl font-bold tracking-tight">Sistema Técnico — Taller (VE)</h1>
      <p className="mt-1 text-sm text-stone-500">
        es-VE · VES con referencia USD · America/Caracas.{" "}
        <a className="font-medium text-emerald-700 underline" href="/login">Iniciar sesión</a>
      </p>
      <nav aria-label="Módulos" className="mt-4 grid gap-3 sm:grid-cols-2">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            <Card className="h-full transition-colors hover:border-emerald-600">
              <p className="font-medium">{l.titulo}</p>
              <p className="text-sm text-stone-500">{l.desc}</p>
            </Card>
          </a>
        ))}
      </nav>
    </Page>
  );
}
