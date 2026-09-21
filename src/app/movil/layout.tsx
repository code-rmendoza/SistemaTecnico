import { requireRole } from "@/lib/require-role";

export default function MovilLayout({ children }: { children: React.ReactNode }) {
  requireRole(["admin", "tecnico"]);
  return <>{children}</>;
}
