// Guardia de MARCA ÚNICA (Ricardo, 2026-09-30: "LOGO CONSISTENCY! the whole
// website consistency! I don't want this to ever happen again").
//
// Qué pasó: el sitio llegó a tener 3 logos (corazón en el sitio público,
// aro en el campus, wordmark viejo) y 2 paletas a la vez, porque cada pantalla
// dibujaba su logo y tipeaba sus colores a mano. Este script lo hace
// imposible de deployar: corre en `npm run lint` y en `prebuild` (Vercel
// ejecuta prebuild antes de cada deploy — un build con la marca rota falla).
//
// Reglas:
//  1. Colores de marca solo en src/app/globals.css (tokens). En el resto:
//     var(--token). Se permiten blanco/negro puros (#fff, rgba(255,255,255,a),
//     rgba(0,0,0,a)) porque no son de marca.
//  2. El logo solo se dibuja en src/components/brand/Logo.tsx (y el favicon
//     src/app/icon.svg, que es la misma forma). Nadie más define un degradé
//     ni el viejo corazón.
//  3. Nunca vuelve el logo viejo (el path del corazón) ni el subtítulo viejo.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const RAIZ = process.cwd();
const SRC = join(RAIZ, "src");

// Excepciones con motivo. Agregar acá SOLO con un motivo real.
const EXCEPCIONES = {
  "src/app/globals.css": "fuente única de los tokens de marca",
  "src/app/icon.svg": "favicon estático: no puede leer variables CSS (misma forma que LogoMark)",
  "src/components/brand/Logo.tsx": "único lugar donde se dibuja el logo",
  // Pausa de pagos (Ricardo, 2026-09-12): no se tocan archivos de checkout
  // hasta que él la levante. Al levantarla, pasar su sombra a var(--sombra-md)
  // y borrar estas dos líneas.
  "src/app/checkout/[slug]/page.tsx": "congelado por pausa de pagos",
  "src/app/checkout/retorno/page.tsx": "congelado por pausa de pagos",
};

const reglas = [
  {
    nombre: "color hex fuera de globals.css",
    re: /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g,
    permitido: (m) => /^#(fff|ffffff|000|000000)$/i.test(m),
  },
  {
    nombre: "rgba/rgb de marca fuera de globals.css",
    re: /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+[^)]*\)/g,
    permitido: (m) => /^rgba?\(\s*(255\s*,\s*255\s*,\s*255|0\s*,\s*0\s*,\s*0)\b/.test(m),
  },
  { nombre: "logo dibujado fuera de brand/Logo.tsx (degradé)", re: /<linearGradient|linear-gradient\([^)]*url\(/g },
  { nombre: "logo viejo (corazón)", re: /M12 21c-4-3-7-6\.5|M12 20\.2c-3\.6-2\.7/g },
  { nombre: "subtítulo viejo del logo", re: /Cursos con Marcela Calder[oó]n/gi },
];

function archivos(dir) {
  const out = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) out.push(...archivos(ruta));
    else if (/\.(tsx?|css|svg)$/.test(nombre)) out.push(ruta);
  }
  return out;
}

const fallas = [];
for (const ruta of archivos(SRC)) {
  const rel = relative(RAIZ, ruta).split(sep).join("/");
  if (EXCEPCIONES[rel]) continue;
  const lineas = readFileSync(ruta, "utf8").split("\n");
  lineas.forEach((linea, i) => {
    for (const regla of reglas) {
      for (const m of linea.matchAll(regla.re)) {
        if (regla.permitido?.(m[0])) continue;
        fallas.push(`${rel}:${i + 1}  [${regla.nombre}]  ${m[0]}`);
      }
    }
  });
}

if (fallas.length > 0) {
  console.error("\n✗ Marca rota — el sitio tiene que verse como UNA sola marca:\n");
  for (const f of fallas) console.error("  " + f);
  console.error(
    "\nUsá var(--token) de src/app/globals.css y <Logo/> / <LogoMark/> de src/components/brand/Logo.tsx.\n",
  );
  process.exit(1);
}
console.log("✓ Marca única: sin colores sueltos ni logos duplicados.");
