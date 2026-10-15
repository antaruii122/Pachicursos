import { campusCard } from "@/components/campus/ui";
import { ListaClases } from "@/components/campus/ListaClases";
import { cargarCampus } from "@/lib/campus";
import { redirect } from "next/navigation";

// /modulos lleva al módulo en curso. Un programa sin módulos (cursos antiguos)
// muestra directamente su lista de clases.
export default async function ModulosPage() {
  const { principal } = await cargarCampus("/modulos");

  if (!principal) {
    return (
      <div className="mx-auto w-[min(1180px,92vw)] py-12">
        <div className={`${campusCard} p-8 text-center`}>
          <p className="text-[var(--tinta-suave)]">Todavía no tienes programas activos.</p>
        </div>
      </div>
    );
  }

  if (principal.tieneModulos) {
    const actual = principal.siguiente?.moduloNumero ?? principal.modulos.find((m) => m.numero !== null)?.numero ?? 1;
    redirect(`/modulos/${actual}`);
  }

  return (
    <div className="mx-auto w-[min(1180px,92vw)] py-12">
      <h1 className="text-[clamp(1.8rem,4vw,2.6rem)]">Clases</h1>
      <p className="mt-1 font-[family-name:var(--font-ui)] text-[.9rem] text-[var(--tinta-suave)]">{principal.titulo}</p>
      <div className="mt-8">
        <ListaClases slug={principal.slug} clases={principal.clases} siguienteOrden={principal.siguiente?.orden ?? null} />
      </div>
    </div>
  );
}
