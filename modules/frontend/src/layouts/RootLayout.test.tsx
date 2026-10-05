import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { RootLayout } from "./RootLayout";
import { appRoutes } from "@/routes";
import { useSessionStore } from "@/store/useSessionStore";

const reload = vi.hoisted(() => vi.fn());
vi.mock("@/modules/core/utils/reloadPage", () => ({ reloadPage: reload }));

const WARMING_TITLE = "Preparando tu consultorio digital";
const WARMING_LEAD = "Estamos preparando tu consultorio digital para iniciar el día, esto puede tomar un minuto…";

/** `/auth/refresh` retenido hasta `release`: simula el servidor despertando. */
function holdRefresh(outcome: "ok" | "fail") {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const calls = { count: 0 };
  server.use(
    http.post("*/auth/refresh", async () => {
      calls.count += 1;
      await gate;
      return outcome === "ok"
        ? HttpResponse.json({ accessToken: "t", user: { id: 1, email: "ana@clinica.test", role: "USER", fullName: "Ana" } })
        : new HttpResponse(null, { status: 401 });
    }),
  );
  return { release, calls };
}

/** RootLayout real con una página de inicio mínima y las rutas de invitado de la app (login). */
function renderRoot({ strict = false, path = "/inicio" } = {}) {
  const router = createMemoryRouter(
    [{ element: <RootLayout />, children: [{ path: "/inicio", element: <h1>Inicio</h1> }, ...appRoutes] }],
    { initialEntries: [path] },
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tree = (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
}

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const warmingStatus = () => screen.queryByRole("status");

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  useSessionStore.setState({ accessToken: null, user: null, status: "idle" });
  reload.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("project-foundation — Pantalla de arranque en frío al cargar la app", () => {
  it("Respuesta rápida: solo 'Cargando…' y luego la app", async () => {
    const { release } = holdRefresh("ok");
    renderRoot();
    expect(screen.getByText("Cargando…")).toBeInTheDocument();

    await advance(2_000);
    release();
    expect(await screen.findByRole("heading", { name: "Inicio" })).toBeInTheDocument();
    expect(screen.queryByText(WARMING_TITLE)).not.toBeInTheDocument();
  });

  it("Servidor despertando: a los 4 s, título, mensaje en una región status y barra < 100", async () => {
    const { release } = holdRefresh("ok");
    renderRoot();

    await advance(3_000);
    expect(warmingStatus()).not.toBeInTheDocument();

    await advance(1_500);
    const status = screen.getByRole("status");
    expect(within(status).getByRole("heading", { name: WARMING_TITLE })).toBeInTheDocument();
    expect(within(status).getByText(WARMING_LEAD)).toBeInTheDocument();
    const bar = screen.getByRole("progressbar", { name: "Preparando el servidor" });
    expect(Number(bar.getAttribute("aria-valuenow"))).toBeLessThan(100);
    release();
  });

  it("Espera demasiado larga: a los 90 s, 'Reintentar' con el foco y recarga al pulsarlo", async () => {
    const { release } = holdRefresh("ok");
    renderRoot();

    await advance(91_000);
    expect(screen.getByRole("heading", { name: "Está tardando más de lo normal" })).toBeInTheDocument();
    const retry = screen.getByRole("button", { name: "Reintentar" });
    expect(retry).toHaveFocus();

    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(retry);
    expect(reload).toHaveBeenCalledTimes(1);
    release();
  });

  it("Llega la respuesta durante la espera larga: la app continúa sola", async () => {
    const { release } = holdRefresh("ok");
    renderRoot();
    await advance(95_000);
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();

    release();
    expect(await screen.findByRole("heading", { name: "Inicio" })).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });

  it("Sin conexión: aviso propio en lugar del arranque y recarga al volver la red", async () => {
    const onLine = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const { release } = holdRefresh("ok");
    renderRoot();

    expect(screen.getByRole("heading", { name: "Sin conexión a internet" })).toBeInTheDocument();
    await advance(10_000);
    expect(screen.queryByText(WARMING_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    onLine.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(reload).toHaveBeenCalledTimes(1);
    release();
  });

  it("Restauración exitosa tras la espera: la pantalla desaparece y la app sigue con la sesión", async () => {
    const { release } = holdRefresh("ok");
    renderRoot();
    await advance(10_000);
    expect(screen.getByText(WARMING_TITLE)).toBeInTheDocument();

    release();
    expect(await screen.findByRole("heading", { name: "Inicio" })).toBeInTheDocument();
    expect(screen.queryByText(WARMING_TITLE)).not.toBeInTheDocument();
    expect(useSessionStore.getState().status).toBe("authenticated");
  });

  it("Restauración fallida tras la espera: sesión limpia y login sin la pantalla", async () => {
    const { release } = holdRefresh("fail");
    renderRoot({ path: "/auth/login" });
    await advance(10_000);
    expect(screen.getByText(WARMING_TITLE)).toBeInTheDocument();

    release();
    expect(await screen.findByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.queryByText(WARMING_TITLE)).not.toBeInTheDocument();
    expect(useSessionStore.getState().status).toBe("unauthenticated");
  });

  it("Montaje doble en StrictMode: un solo refresh, la pantalla una vez y sin timers al final", async () => {
    // Los intervalos del contador: el global de timers incluye los de React Query/router, ajenos a esto.
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const { release, calls } = holdRefresh("ok");
    const { unmount } = renderRoot({ strict: true });

    await advance(5_000);
    expect(screen.getAllByRole("heading", { name: WARMING_TITLE })).toHaveLength(1);
    expect(calls.count).toBe(1);

    release();
    await screen.findByRole("heading", { name: "Inicio" });
    unmount();
    const created = setIntervalSpy.mock.results.map((result) => result.value as unknown);
    const cleared = new Set(clearIntervalSpy.mock.calls.map(([id]) => id as unknown));
    expect(created.length).toBeGreaterThan(0);
    expect(created.filter((id) => !cleared.has(id))).toEqual([]);
  });
});
