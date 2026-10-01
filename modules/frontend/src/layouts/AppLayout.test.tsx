import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { appRoutes } from "@/routes";
import { RouteError } from "@/modules/core/components/RouteError";
import { TooltipProvider } from "@/modules/core/ui/tooltip";
import { useSessionStore, type SessionUser } from "@/store/useSessionStore";

const ANA: SessionUser = { id: 1, email: "ana@empresa.test", role: "USER", fullName: "Ana Pérez" };

function signIn(user: SessionUser = ANA) {
  useSessionStore.setState({ accessToken: "tok", user, status: "authenticated" });
}

/** Monta el árbol de rutas real (sin el bootstrap de RootLayout) en la ruta dada. */
function renderApp(path: string) {
  const router = createMemoryRouter([{ errorElement: <RouteError />, children: appRoutes }], {
    initialEntries: [path],
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  // Sin RootLayout: el TooltipProvider de la raíz se monta aquí (sin retardo en tests).
  render(
    <TooltipProvider delayDuration={0}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </TooltipProvider>,
  );
  return router;
}

const mainNav = () => screen.getByRole("navigation", { name: "Navegación principal" });

beforeEach(() => {
  useSessionStore.setState({ accessToken: null, user: null, status: "unauthenticated" });
});

describe("app-shell — Layout privado común", () => {
  it("Ruta privada dentro del shell: muestra sidebar, cabecera y contenido", async () => {
    signIn();
    renderApp("/");

    expect(await screen.findByRole("heading", { level: 1, name: "Hola, Ana Pérez" })).toBeInTheDocument();
    expect(mainNav()).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(within(screen.getByRole("main")).getByRole("heading", { level: 1 })).toHaveTextContent("Hola, Ana Pérez");
  });

  it("Rutas de invitado sin shell: login y registro no muestran sidebar ni cabecera", async () => {
    renderApp("/auth/login");
    expect(await screen.findByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Navegación principal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
  });

  it("Rutas de invitado sin shell: registro", async () => {
    renderApp("/auth/register");
    expect(await screen.findByRole("button", { name: /crear cuenta/i })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Navegación principal" })).not.toBeInTheDocument();
  });
});

describe("app-shell — Navegación declarada por configuración", () => {
  it("Ítem activo resaltado: solo el ítem de la ruta actual lleva aria-current", async () => {
    signIn();
    renderApp("/modulo-a");

    const nav = await screen.findByRole("navigation", { name: "Navegación principal" });
    expect(within(nav).getByRole("link", { name: "Módulo A" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Inicio" })).not.toHaveAttribute("aria-current");
  });

  it("Navegar a un ítem de ejemplo: muestra 'Próximamente' con el nombre y mantiene el shell", async () => {
    signIn();
    const user = userEvent.setup();
    const router = renderApp("/");

    await user.click(within(await screen.findByRole("navigation", { name: "Navegación principal" })).getByRole("link", { name: "Módulo A" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Módulo A" })).toBeInTheDocument();
    expect(screen.getByText(/próximamente/i)).toBeInTheDocument();
    expect(mainNav()).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/modulo-a");
  });

  it("Ruta privada inexistente: muestra la página de no encontrado", async () => {
    signIn();
    renderApp("/no-existe");
    expect(await screen.findByRole("heading", { name: "Página no encontrada" })).toBeInTheDocument();
  });
});

describe("app-shell — Identidad en la cabecera y cierre de sesión en la barra lateral", () => {
  it("Identidad del usuario con nombre: muestra nombre completo y rol", async () => {
    signIn();
    renderApp("/");
    const header = await screen.findByRole("banner");
    expect(within(header).getByText("Ana Pérez")).toBeInTheDocument();
    expect(within(header).getByText("Usuario")).toBeInTheDocument();
  });

  it("Identidad del usuario sin nombre: muestra correo y rol", async () => {
    signIn({ id: 2, email: "admin@empresa.test", role: "ADMIN" });
    renderApp("/");
    const header = await screen.findByRole("banner");
    expect(within(header).getByText("admin@empresa.test")).toBeInTheDocument();
    expect(within(header).getByText("Administrador")).toBeInTheDocument();
  });

  it("Cerrar sesión desde la barra lateral: ejecuta el logout y deshabilita el botón mientras tanto", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.post("*/auth/logout", async () => {
        await pending;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    signIn();
    const user = userEvent.setup();
    renderApp("/");

    const sidebar = await screen.findByRole("complementary");
    const logoutButton = within(sidebar).getByRole("button", { name: "Cerrar sesión" });
    expect(within(screen.getByRole("banner")).queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
    await user.click(logoutButton);
    await waitFor(() => expect(logoutButton).toBeDisabled());

    release();
    await waitFor(() => expect(useSessionStore.getState().status).toBe("unauthenticated"));
    expect(await screen.findByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });
});

describe("app-shell — Navegación responsive (tooltips de la barra compacta)", () => {
  // En jsdom no hay CSS: la barra `rail` (compacta) siempre está en el DOM, y el cajón solo al abrirlo.
  const rail = () => screen.getByRole("complementary");

  it("Tooltip en la barra compacta: al enfocar con el teclado muestra el nombre", async () => {
    signIn();
    renderApp("/");
    const link = within(await screen.findByRole("navigation", { name: "Navegación principal" })).getByRole("link", { name: "Módulo A" });

    link.focus();

    expect(await screen.findByRole("tooltip", { name: "Módulo A" })).toBeInTheDocument();
    expect(link).toHaveAttribute("aria-label", "Módulo A");
    expect(link).not.toHaveAttribute("title");
    expect(link).not.toHaveAttribute("aria-describedby"); // solo visual: sin anuncio duplicado
  });

  it("Tooltip en la barra compacta: el enlace conserva sus clases y el estado activo", async () => {
    // Regresión: dentro de TooltipTrigger asChild, un className-función de NavLink se
    // convertía en su código fuente y el enlace perdía todos sus estilos.
    signIn();
    renderApp("/modulo-a");
    const nav = within(await screen.findByRole("navigation", { name: "Navegación principal" }));
    const active = nav.getByRole("link", { name: "Módulo A" });
    const inactive = nav.getByRole("link", { name: "Inicio" });

    expect(active.className).not.toMatch(/=>|isActive/);
    expect(active).toHaveClass("rounded-md", "bg-primary/10", "text-primary");
    expect(inactive).toHaveClass("rounded-md", "text-muted-foreground");
    expect(inactive).not.toHaveClass("bg-primary/10");
  });

  it("Tooltip en la barra compacta: al pasar el ratón muestra el nombre", async () => {
    signIn();
    const user = userEvent.setup();
    renderApp("/");
    const link = within(await screen.findByRole("navigation", { name: "Navegación principal" })).getByRole("link", { name: "Módulo A" });

    await user.hover(link);

    expect(await screen.findByRole("tooltip", { name: "Módulo A" })).toBeInTheDocument();
  });

  it("Tooltip de cerrar sesión: al enfocar muestra 'Cerrar sesión'", async () => {
    signIn();
    renderApp("/");
    await screen.findByRole("navigation", { name: "Navegación principal" });
    const logout = within(rail()).getByRole("button", { name: "Cerrar sesión" });

    logout.focus();

    expect(await screen.findByRole("tooltip", { name: "Cerrar sesión" })).toBeInTheDocument();
    expect(logout).toHaveAttribute("aria-label", "Cerrar sesión");
    expect(logout).not.toHaveAttribute("title");
  });

  it("Sin tooltip en el cajón móvil: al enfocar un ítem del cajón no aparece tooltip", async () => {
    signIn();
    const user = userEvent.setup();
    renderApp("/");
    await user.click(await screen.findByRole("button", { name: "Abrir menú" }));
    const drawer = screen.getByRole("dialog", { name: "Menú de navegación" });

    within(drawer).getByRole("link", { name: "Módulo A" }).focus();

    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
  });
});

describe("app-shell — Navegación responsive (cajón móvil)", () => {
  it("Abrir el cajón en móvil: se abre y el botón refleja aria-expanded", async () => {
    signIn();
    const user = userEvent.setup();
    renderApp("/");

    const menuButton = await screen.findByRole("button", { name: "Abrir menú" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await user.click(menuButton);

    const drawer = screen.getByRole("dialog", { name: "Menú de navegación" });
    expect(within(drawer).getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar menú" })).toHaveAttribute("aria-expanded", "true");
  });

  it("Cerrar el cajón al navegar: navega y cierra", async () => {
    signIn();
    const user = userEvent.setup();
    const router = renderApp("/");

    await user.click(await screen.findByRole("button", { name: "Abrir menú" }));
    const drawer = screen.getByRole("dialog", { name: "Menú de navegación" });
    await user.click(within(drawer).getByRole("link", { name: "Módulo A" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Módulo A" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Menú de navegación" })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/modulo-a");
  });

  it("Cerrar el cajón con Escape: se cierra sin navegar", async () => {
    signIn();
    const user = userEvent.setup();
    const router = renderApp("/");

    await user.click(await screen.findByRole("button", { name: "Abrir menú" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Menú de navegación" })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("Cerrar el cajón con clic fuera: se cierra sin navegar", async () => {
    signIn();
    const user = userEvent.setup();
    const router = renderApp("/");

    await user.click(await screen.findByRole("button", { name: "Abrir menú" }));
    await user.click(screen.getByRole("button", { name: "Cerrar menú de navegación" }));

    expect(screen.queryByRole("dialog", { name: "Menú de navegación" })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });
});
