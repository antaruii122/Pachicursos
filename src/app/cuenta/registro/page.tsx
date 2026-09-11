import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { RegistroForm } from "@/components/auth/RegistroForm";

export default function RegistroPage() {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--crema)]">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center p-6">
        <RegistroForm />
      </div>
      <SiteFooter />
    </div>
  );
}
