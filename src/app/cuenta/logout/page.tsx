"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Cierra sesión y vuelve al login. Vive en su propia ruta para poder
// enlazarla desde cualquier header/nav una vez que existan (Parte C).
export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.signOut().then(() => {
      router.push("/cuenta/login");
      router.refresh();
    });
  }, [router]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <p className="text-sm text-[#8A5C68]">Cerrando sesión...</p>
    </div>
  );
}
