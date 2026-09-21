import { LogoutButton } from "@/components/logout-button";

const NAV = [
  { href: "/ordenes", label: "Órdenes" },
  { href: "/clientes", label: "Clientes" },
  { href: "/inventario", label: "Inventario" },
  { href: "/caja", label: "Caja" },
  { href: "/movil", label: "Móvil" },
  { href: "/portal", label: "Portal" },
  { href: "/admin/reportes", label: "Reportes" }
];

/** Shell con navegación. Solo envuelve rutas internas (grupo `(shell)`):
 * login y portal quedan como vistas aparte, sin menú. */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6">
          <a href="/" className="text-sm font-bold tracking-tight">
            ⚙ Sistema Técnico
          </a>
          <nav aria-label="Principal" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {NAV.map((l) => (
              <a key={l.href} href={l.href} className="text-slate-300 hover:text-white">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
