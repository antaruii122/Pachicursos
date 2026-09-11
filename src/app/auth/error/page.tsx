import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-svh flex-col bg-[var(--crema)]">
      <SiteHeader />
      <main id="contenido-principal" className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-semibold text-[var(--vino)]">
            Ocurrió un problema
          </h1>
          <p className="mt-2 text-sm text-[var(--tinta-suave)]">
            {error ?? "Ocurrió un error no especificado."}
          </p>
          <a
            href="/cuenta/login"
            className="mt-6 inline-block rounded-full bg-[var(--vino)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--vino-claro)]"
          >
            Volver a iniciar sesión
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
