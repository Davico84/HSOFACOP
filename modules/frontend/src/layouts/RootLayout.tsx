import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { useSessionBootstrap } from "@/modules/auth/hooks/useSessionBootstrap";
import { TooltipProvider } from "@/modules/core/ui/tooltip";

/**
 * Layout raíz: restaura la sesión al arrancar (splash mientras resuelve el
 * refresh) y monta el contenedor + los toasts. Los guards deciden con el
 * `status` ya resuelto.
 */
export function RootLayout() {
  const status = useSessionBootstrap();

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Cargando…
      </div>
    );
  }

  // TooltipProvider en la raíz (lo pide shadcn): un único contexto para todos los tooltips.
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Outlet />
        <Toaster richColors position="top-right" />
      </div>
    </TooltipProvider>
  );
}
