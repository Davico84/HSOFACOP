import { useSessionStore } from "@/store/useSessionStore";
import { AdminDashboardSection } from "./AdminDashboardSection";
import { CoordinatorDashboardSection } from "./CoordinatorDashboardSection";
import { UserDashboardSection } from "./UserDashboardSection";

const SUBTITLE = {
  ADMIN: "Resumen del uso del sistema.",
  USER: "Tu avance con las historias clínicas.",
  COORDINATOR: "Avance de los alumnos de tus turmas.",
} as const;

/** Inicio: saludo y métricas según el rol (ADMIN: globales; coordinación: sus turmas; alumno: las suyas). */
export function DashboardFeature() {
  const user = useSessionStore((s) => s.user);
  const name = user?.fullName ?? user?.email;
  const role = user?.role ?? "USER";

  let section;
  if (role === "ADMIN") section = <AdminDashboardSection />;
  else if (role === "COORDINATOR") section = <CoordinatorDashboardSection />;
  else section = <UserDashboardSection />;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{name ? `Hola, ${name}` : "Hola"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{SUBTITLE[role]}</p>
      </div>
      {section}
    </div>
  );
}
