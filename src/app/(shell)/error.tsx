"use client";

export default function ShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="rounded-2xl bg-white p-8 shadow-xl border border-slate-200">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-slate-900">Error en el panel</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ocurrió un error al cargar esta sección.
          </p>
          <div className="mt-4 flex gap-2 justify-center">
            <button
              onClick={() => reset()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Reintentar
            </button>
            <a
              href="/"
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Ir al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
