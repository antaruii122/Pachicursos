import { PantallaIngreso } from "@/components/auth/PantallaIngreso";

// Misma pantalla que la home (pantalla 1 de la maqueta). Se mantiene esta
// ruta porque las páginas privadas redirigen acá con `?next=`.
export default function LoginPage() {
  return <PantallaIngreso />;
}
