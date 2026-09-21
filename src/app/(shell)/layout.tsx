import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { ToastProvider } from "@/components/toast";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get("session")?.value;
  let email = "";
  let rol: "admin" | "recepcion" | "tecnico" | "cliente" = "recepcion";

  if (token) {
    try {
      const session = verifySession(token, process.env.JWT_SECRET ?? "dev-secret-solo-local");
      email = session.sub;
      rol = session.rol;
    } catch {
      // session inválida; las sub-rutas protegidas redirigen a login
    }
  }

  return (
    <ToastProvider>
      <div className="min-h-screen">
        <Sidebar userRole={rol} />
        <TopBar email={email} rol={rol} />
        <div className="md:pl-[var(--sidebar-width)] pt-[var(--topbar-height)] transition-all duration-300">
          <main className="animate-fade-in">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
