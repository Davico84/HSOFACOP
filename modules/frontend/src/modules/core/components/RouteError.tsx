import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { buttonVariants } from "@/modules/core/ui/button-variants";
import { cn } from "@/modules/core/utils/cn";
import { PATHS } from "@/routes/paths";

/**
 * Pantalla de error de rutas (reemplaza el fallback por defecto de react-router).
 * Cubre rutas no encontradas (404) y errores inesperados en render/loader/action.
 * Se conecta como `errorElement` de la ruta raíz.
 */
export function RouteError() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  const code = is404 ? "404" : "Error";
  const title = is404 ? "Página no encontrada" : "Algo salió mal";
  const message = is404
    ? "La página que buscas no existe o fue movida."
    : "Ocurrió un error inesperado. Vuelve a intentarlo.";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-4 text-center">
      <p className="text-5xl font-bold text-primary">{code}</p>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="max-w-sm text-muted-foreground">{message}</p>
      <Link to={PATHS.ROOT} className={cn(buttonVariants())}>
        Volver al inicio
      </Link>
    </main>
  );
}
