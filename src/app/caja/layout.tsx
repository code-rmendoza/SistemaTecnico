import { requireRole } from "@/lib/require-role";

export default function CajaLayout({ children }: { children: React.ReactNode }) {
  requireRole(["admin", "recepcion"]);
  return <>{children}</>;
}
