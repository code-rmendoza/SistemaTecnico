import "./globals.css";

export const metadata = {
  title: "Sistema Técnico",
  description: "Taller electrónica general — Venezuela (es-VE)",
  manifest: "/manifest.json"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-VE">
      <body>{children}</body>
    </html>
  );
}
