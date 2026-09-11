import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--crema)]">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center p-6">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
