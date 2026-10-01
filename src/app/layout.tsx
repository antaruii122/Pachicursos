import type { Metadata } from "next";
import { DM_Sans, EB_Garamond } from "next/font/google";
import "./globals.css";

// Tipografías de la maqueta Campus NUTFEM (identificadas 2026-10-01
// comparando letra por letra con la maqueta): EB Garamond para títulos
// (ligadura "fi", "ó", "x" idénticas) y DM Sans para texto, etiquetas y
// botones. Vía next/font (auto-hosting, sin bloquear el render).
const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
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
      className={`${garamond.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
