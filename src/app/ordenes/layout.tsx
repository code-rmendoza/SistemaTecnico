import { requireRole } from "@/lib/require-role";

export default function OrdenesLayout({ children }: { children: React.ReactNode }) {
  requireRole(["admin", "recepcion", "tecnico"]);
  return <>{children}</>;
}
