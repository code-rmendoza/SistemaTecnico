import "./globals.css";

export const metadata = {
  title: "Sistema Técnico",
  description: "Taller electrónica general — Venezuela (es-VE)",
  manifest: "/manifest.json"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-VE">
      <body className="min-h-screen bg-stone-100 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
