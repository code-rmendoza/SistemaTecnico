import "./globals.css";

export const metadata = {
  title: "Sistema Técnico",
  description: "Taller electrónica general — Venezuela (es-VE)",
  manifest: "/manifest.json"
};

const NAV = [
  { href: "/ordenes", label: "Órdenes" },
  { href: "/clientes", label: "Clientes" },
  { href: "/inventario", label: "Inventario" },
  { href: "/caja", label: "Caja" },
  { href: "/movil", label: "Móvil" },
  { href: "/portal", label: "Portal" },
  { href: "/admin/reportes", label: "Reportes" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-VE">
      <body className="min-h-screen bg-stone-100 text-stone-900 antialiased">
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
            <a href="/login" className="ml-auto text-sm text-slate-300 hover:text-white">
              Entrar
            </a>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
