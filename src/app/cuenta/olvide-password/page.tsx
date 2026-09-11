import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { OlvidePasswordForm } from "@/components/auth/OlvidePasswordForm";

export default function OlvidePasswordPage() {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--crema)]">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center p-6">
        <OlvidePasswordForm />
      </div>
      <SiteFooter />
    </div>
  );
}
