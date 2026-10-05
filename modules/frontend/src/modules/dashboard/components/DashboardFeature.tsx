import { useSessionStore } from "@/store/useSessionStore";
import { AdminDashboardSection } from "./AdminDashboardSection";
import { UserDashboardSection } from "./UserDashboardSection";

/** Inicio: saludo y métricas según el rol (el ADMIN ve solo las globales). */
export function DashboardFeature() {
  const user = useSessionStore((s) => s.user);
  const name = user?.fullName ?? user?.email;
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{name ? `Hola, ${name}` : "Hola"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAdmin ? "Resumen del uso del sistema." : "Tu avance con las historias clínicas."}
        </p>
      </div>
      {isAdmin ? <AdminDashboardSection /> : <UserDashboardSection />}
    </div>
  );
}
