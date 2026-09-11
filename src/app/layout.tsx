import type { Metadata } from "next";
import { Lato, Noto_Serif, Poppins } from "next/font/google";
import "./globals.css";

// Sistema visual de marca (docs/cursos.md): Lato para cuerpo, Noto Serif para
// títulos, Poppins para labels/botones/UI. Vía next/font para auto-hosting
// y sin bloquear el render (en vez del <link> de Google Fonts del mockup).
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// NOTA: hardcodeado a la URL real que funciona hoy (`https://pachicursos.vercel.app`),
// no a `NEXT_PUBLIC_SITE_URL` (que ya apunta al subdominio real `cursos.alimentatufertilidad.com`
// para las urls de Flow.cl, aunque el DNS todavía no esté apuntado — ver Parte A en
// EJECUCION.md). Si se usara esa variable acá, las imágenes de Open Graph armarían URLs
// absolutas contra un dominio que todavía no resuelve. Actualizar cuando el DNS esté listo.
const SITE_URL = "https://pachicursos.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Alimenta Tu Fertilidad — Cursos",
  description: "Cursos en línea de nutrición y fertilidad femenina con Marcela Calderón.",
  openGraph: {
    siteName: "Alimenta Tu Fertilidad — Cursos",
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
      className={`${lato.variable} ${notoSerif.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
