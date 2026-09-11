"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LogoutRedirect() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.signOut().then(() => {
      router.push("/cuenta/login");
      router.refresh();
    });
  }, [router]);

  return (
    <p role="status" className="text-sm text-[var(--tinta-suave)]">
      Cerrando sesión...
    </p>
  );
}
