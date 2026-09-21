import { requireRole } from "@/lib/require-role";

export default function ClientesLayout({ children }: { children: React.ReactNode }) {
  requireRole(["admin", "recepcion", "tecnico"]);
  return <>{children}</>;
}
