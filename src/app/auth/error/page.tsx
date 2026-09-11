export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold text-[#3B1420]">
          Ocurrió un problema
        </h1>
        <p className="mt-2 text-sm text-[#8A5C68]">
          {error ?? "Ocurrió un error no especificado."}
        </p>
        <a
          href="/cuenta/login"
          className="mt-6 inline-block rounded-full bg-[#4E0F26] px-6 py-2 text-sm font-medium text-white hover:bg-[#7A1533]"
        >
          Volver a iniciar sesión
        </a>
      </div>
    </div>
  );
}
