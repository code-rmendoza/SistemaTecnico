import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Sistema Técnico",
  description: "Taller electrónica general — Venezuela (es-VE)",
  manifest: "/manifest.json"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-VE" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">{children}</body>
    </html>
  );
}
