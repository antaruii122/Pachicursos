import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

// Tipografías de la guía de estilo NUTFEM 2027 (Pachi, 2026-10-16): Inter Tight
// para títulos y Inter para texto, etiquetas y botones. Vía next/font
// (auto-hosting, sin bloquear el render).
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// NOTA: hardcodeado a la URL real que funciona hoy (`https://pachicursos.vercel.app`),
// no a `NEXT_PUBLIC_SITE_URL` (que ya apunta al subdominio real `cursos.alimentatufertilidad.com`
// para las urls de Flow.cl, aunque el DNS todavía no esté apuntado — ver Parte A en
// EJECUCION.md). Si se usara esa variable acá, las imágenes de Open Graph armarían URLs
// absolutas contra un dominio que todavía no resuelve. Actualizar cuando el DNS esté listo.
const SITE_URL = "https://pachicursos.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Campus NUTFEM",
  description: "Campus NUTFEM: plataforma privada para alumnas del Diplomado.",
  openGraph: {
    siteName: "Campus NUTFEM",
    type: "website",
    locale: "es_CL",
  },
  twitter: {
    card: "summary",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${interTight.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
