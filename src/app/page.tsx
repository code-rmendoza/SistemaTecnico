const LINKS = [
  { href: "/ordenes", titulo: "Órdenes", desc: "Crear, diagnosticar, presupuestar y entregar" },
  { href: "/clientes", titulo: "Clientes", desc: "Alta, búsqueda y equipos" },
  { href: "/inventario", titulo: "Inventario", desc: "Repuestos y movimientos" },
  { href: "/caja", titulo: "Caja", desc: "Tasa, cobros y cierre dual" },
  { href: "/movil", titulo: "Móvil técnicos", desc: "Cola asignada" },
  { href: "/portal", titulo: "Portal cliente", desc: "Consulta por código (público)" },
  { href: "/admin/reportes", titulo: "Reportes", desc: "Ingresos y cuentas por cobrar (admin)" }
];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Sistema Técnico — Taller (VE)</h1>
      <p className="mt-2 text-sm opacity-80">
        es-VE · VES con referencia USD · America/Caracas.{" "}
        <a className="underline" href="/login">Iniciar sesión</a>
      </p>
      <nav className="mt-4 grid gap-2">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className="rounded border p-3 hover:bg-gray-50">
            <strong>{l.titulo}</strong>
            <span className="block text-sm opacity-70">{l.desc}</span>
          </a>
        ))}
      </nav>
    </main>
  );
}
