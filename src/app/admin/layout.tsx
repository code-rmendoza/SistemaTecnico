import { requireRole } from "@/lib/require-role";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  requireRole(["admin"]);
  return <>{children}</>;
}
