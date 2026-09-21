"use client";

export function LogoutButton() {
  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button onClick={salir} className="text-sm text-slate-300 hover:text-white">
      Salir
    </button>
  );
}
