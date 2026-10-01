import { Link } from "react-router-dom";
import { buttonVariants } from "@/modules/core/ui/button-variants";
import { cn } from "@/modules/core/utils/cn";
import { PATHS } from "@/routes/paths";

/**
 * "No encontrado" DENTRO del shell para subrutas inexistentes de una sección restringida.
 * Existe para que esas subrutas pasen por el guard de rol: si cayeran en el 404 global (que
 * React Router resuelve antes de montar ningún guard), un rol sin permiso podría averiguar qué
 * subrutas existen (las reales dan "Acceso denegado"; las inexistentes, 404).
 */
export function SectionNotFound() {
  return (
    <section className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-bold text-foreground">Página no encontrada</h1>
      <p className="max-w-sm text-muted-foreground">La página que buscas no existe o fue movida.</p>
      <Link to={PATHS.ROOT} className={cn(buttonVariants())}>
        Volver al inicio
      </Link>
    </section>
  );
}
