import type { ReactNode } from "react";
import { cn } from "./cn";

export function Page({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <main className={cn("mx-auto w-full p-6 lg:p-8", wide ? "max-w-[1200px]" : "max-w-3xl")}>
      {children}
    </main>
  );
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
    </header>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "danger" | "ghost";
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" && "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md active:bg-emerald-800",
        variant === "outline" && "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300",
        variant === "danger" && "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md active:bg-red-800",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        className
      )}
      {...props}
    />
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-slate-200/60 bg-white p-5 shadow-card", className)}>
      {children}
    </section>
  );
}

export function Field({
  id,
  label,
  children
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputCls =
  "input-modern";

const ESTADO_STYLE: Record<string, string> = {
  INGRESADA: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  DIAGNOSTICO: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  PRESUPUESTADA: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  APROBADA: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  EN_REPARACION: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  CONTROL_CALIDAD: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
  LISTA_ENTREGA: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  ENTREGADA: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  CANCELADA: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={cn(
        "badge-pill",
        ESTADO_STYLE[estado] ?? "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
      )}
    >
      {estado.replace(/_/g, " ")}
    </span>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <svg className="h-5 w-5 shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
      <svg className="h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center">
      <svg className="h-10 w-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25m-2.25 2.25V7.875M3.375 7.5h17.25" />
      </svg>
      <p className="text-sm text-slate-500 max-w-sm">{children}</p>
    </div>
  );
}
