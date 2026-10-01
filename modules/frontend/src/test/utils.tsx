import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/modules/core/ui/tooltip";

interface RenderOptions {
  /** Rutas iniciales del MemoryRouter (para flujos con navegación). */
  initialEntries?: string[];
}

/**
 * Renderiza con los providers base (React Query + Router). Crea un QueryClient
 * nuevo por render con reintentos desactivados. Las capacidades añadirán aquí
 * sus providers (sesión, i18n) cuando existan.
 */
export function renderWithProviders(
  ui: ReactElement,
  { initialEntries = ["/"] }: RenderOptions = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // TooltipProvider como en RootLayout (sin retardo en tests).
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );

  return render(ui, { wrapper: Wrapper });
}
