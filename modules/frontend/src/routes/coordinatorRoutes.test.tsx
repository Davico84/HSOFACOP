import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { appRoutes } from "@/routes";
import { RouteError } from "@/modules/core/components/RouteError";
import { TooltipProvider } from "@/modules/core/ui/tooltip";
import { useSessionStore } from "@/store/useSessionStore";
import { useSidebarStore } from "@/store/useSidebarStore";

function renderAs(path: string) {
  useSessionStore.setState({
    accessToken: "tok",
    status: "authenticated",
    user: { id: 7, email: "coord@empresa.test", role: "COORDINATOR", fullName: "Dra. Coordinación" },
  });
  const router = createMemoryRouter([{ errorElement: <RouteError />, children: appRoutes }], { initialEntries: [path] });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <TooltipProvider delayDuration={0}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </TooltipProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useSidebarStore.setState({ collapsed: false });
  server.use(http.get("*/api/dashboard/coordinator", () => HttpResponse.json({ cohorts: [] })));
});

describe("cohorts — rutas y menú de la coordinación", () => {
  it("el menú muestra solo Inicio, Historias clínicas y Mis datos, y el rol 'Coordinación'", async () => {
    renderAs("/");

    const nav = await screen.findByRole("navigation", { name: "Navegación principal" });
    expect(within(nav).getAllByRole("link").map((l) => l.getAttribute("aria-label") ?? l.textContent)).toEqual([
      "Inicio",
      "Historias clínicas",
      "Mis datos",
    ]);
    expect(within(screen.getByRole("banner")).getByText("Coordinación")).toBeInTheDocument();
  });

  it("el formulario de una historia muestra el acceso denegado", async () => {
    renderAs("/historias/10");
    expect(await screen.findByRole("heading", { name: /Acceso denegado/ })).toBeInTheDocument();
  });

  it("'Nueva historia' muestra el acceso denegado", async () => {
    renderAs("/historias/nueva");
    expect(await screen.findByRole("heading", { name: /Acceso denegado/ })).toBeInTheDocument();
  });

  it("'Usuarios' muestra el acceso denegado", async () => {
    renderAs("/usuarios");
    expect(await screen.findByRole("heading", { name: /Acceso denegado/ })).toBeInTheDocument();
  });
});
