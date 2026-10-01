import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { TooltipProvider } from "@/modules/core/ui/tooltip";
import { useSessionStore, type Role } from "@/store/useSessionStore";
import { RecordsListScreen } from "@/screens/records/RecordsListScreen";
import { RecordFormScreen } from "@/screens/records/RecordFormScreen";
import { RecordPrintScreen } from "@/screens/records/RecordPrintScreen";

/**
 * Monta las pantallas de historias con un router de datos en memoria (como la app: `useBlocker`
 * lo exige) y una sesión del rol indicado. Incluye una ruta "fuera" para probar la salida.
 */
export function renderRecordRoutes(initialPath: string, role: Role = "USER") {
  useSessionStore.setState({
    accessToken: "token",
    status: "authenticated",
    user: { id: 1, email: "torres@empresa.test", role, fullName: "Dra. María Torres" },
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/historias", element: <RecordsListScreen /> },
      { path: "/historias/nueva", element: <RecordFormScreen /> },
      { path: "/historias/:id", element: <RecordFormScreen /> },
      { path: "/historias/:id/imprimir", element: <RecordPrintScreen /> },
      { path: "/fuera", element: <p>Otra sección</p> },
    ],
    { initialEntries: [initialPath] },
  );
  const view = render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>,
  );
  return { ...view, router };
}
