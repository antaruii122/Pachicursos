import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // cover_image_url / background_image_url son URLs libres que solo el
    // admin carga (campo de texto en CourseForm, ver docs/cursos.md — "no
    // todos estos campos necesitan un widget dedicado en la v1"). No hay
    // input público que abuse esto, así que un wildcard https es aceptable
    // acá — la alternativa sería mantener una lista de hosts a mano cada
    // vez que Marcela use una imagen de un lugar nuevo.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
