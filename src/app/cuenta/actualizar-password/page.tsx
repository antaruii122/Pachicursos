import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ActualizarPasswordForm } from "@/components/auth/ActualizarPasswordForm";

export default function ActualizarPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--crema)]">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center p-6">
        <ActualizarPasswordForm />
      </div>
      <SiteFooter />
    </div>
  );
}
