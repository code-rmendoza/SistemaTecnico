"use client";

export function LogoutButton() {
  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      onClick={salir}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
    >
      Salir
    </button>
  );
}
