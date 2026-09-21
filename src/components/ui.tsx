import type { ReactNode } from "react";
import { cn } from "./cn";

export function Page({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <main className={cn("mx-auto w-full p-4 sm:p-6", wide ? "max-w-4xl" : "max-w-2xl")}>{children}</main>;
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mb-4">
      <h1 className="text-xl font-bold tracking-tight text-stone-900">{title}</h1>
      {sub && <p className="mt-1 text-sm text-stone-500">{sub}</p>}
    </header>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "danger";
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50",
        variant === "primary" && "bg-emerald-700 text-white hover:bg-emerald-800",
        variant === "outline" && "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className
      )}
      {...props}
    />
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-stone-200 bg-white p-4", className)}>
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
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-stone-600">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none";

const ESTADO_STYLE: Record<string, string> = {
  INGRESADA: "bg-stone-100 text-stone-700",
  DIAGNOSTICO: "bg-amber-100 text-amber-800",
  PRESUPUESTADA: "bg-sky-100 text-sky-800",
  APROBADA: "bg-indigo-100 text-indigo-800",
  EN_REPARACION: "bg-orange-100 text-orange-800",
  CONTROL_CALIDAD: "bg-yellow-100 text-yellow-800",
  LISTA_ENTREGA: "bg-teal-100 text-teal-800",
  ENTREGADA: "bg-emerald-100 text-emerald-800",
  CANCELADA: "bg-red-100 text-red-700"
};

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
        ESTADO_STYLE[estado] ?? "bg-stone-100 text-stone-700"
      )}
    >
      {estado.replace(/_/g, " ")}
    </span>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
      {children}
    </p>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-sm text-emerald-700">{children}</p>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="mt-3 rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
      {children}
    </p>
  );
}
