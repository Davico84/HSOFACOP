import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { useSessionBootstrap } from "@/modules/auth/hooks/useSessionBootstrap";
import { ServerWarmupScreen } from "@/modules/core/components/ServerWarmupScreen";
import { useElapsedWhile } from "@/modules/core/hooks/useElapsedWhile";
import { useOnlineStatus } from "@/modules/core/hooks/useOnlineStatus";
import { TooltipProvider } from "@/modules/core/ui/tooltip";
import { reloadPage } from "@/modules/core/utils/reloadPage";

/**
 * Layout raíz: restaura la sesión al arrancar y monta el contenedor + los toasts. Mientras el
 * refresh resuelve (la primera petición al backend) muestra `ServerWarmupScreen`, que explica
 * la espera si el servidor está despertando. Los guards deciden con el `status` ya resuelto.
 */
export function RootLayout() {
  const status = useSessionBootstrap();
  const pending = status === "idle" || status === "loading";
  const elapsedSeconds = useElapsedWhile(pending);
  const online = useOnlineStatus();

  if (pending) {
    return <ServerWarmupScreen elapsedSeconds={elapsedSeconds} online={online} onRetry={reloadPage} />;
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
