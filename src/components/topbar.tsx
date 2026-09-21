"use client";

import { LogoutButton } from "./logout-button";
import type { Role } from "@/lib/auth";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  recepcion: "Recepción",
  tecnico: "Técnico",
  cliente: "Cliente",
};

export function TopBar({ email, rol }: { email: string; rol: Role }) {
  return (
    <div className="topbar">
      <div className="ml-auto flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{email}</p>
          <p className="text-xs text-slate-500">{ROLE_LABELS[rol]}</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-bold">
          {email.charAt(0).toUpperCase()}
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
