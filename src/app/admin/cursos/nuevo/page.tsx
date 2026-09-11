import { CourseForm } from "@/components/admin/CourseForm";

export default function NuevoCursoPage() {
  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-heading)] text-[1.6rem] font-semibold text-[var(--vino)]">
        Nuevo curso
      </h1>
      <CourseForm initialCourse={null} clases={[]} />
    </div>
  );
}
