import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { RouteError } from "@/modules/core/components/RouteError";
import { useSessionStore, type SessionUser } from "@/store/useSessionStore";
import { sectionRoute } from "./sectionRoute";

const USER: SessionUser = { id: 1, email: "ana@empresa.test", role: "USER" };
const ADMIN: SessionUser = { id: 2, email: "admin@empresa.test", role: "ADMIN" };
const DATA_URL = "http://localhost/api/__test/modulo-b";

/** Hijo de prueba que carga datos con una query (como lo haría una sección real). */
function SectionData() {
  const { data } = useQuery({
    queryKey: ["modulo-b"],
    queryFn: () => fetch(DATA_URL).then((r) => r.json() as Promise<{ nombre: string }>),
  });
  return <p>Datos: {data?.nombre ?? "cargando"}</p>;
}

function renderSection(path: string) {
  const router = createMemoryRouter(
    [
      {
        errorElement: <RouteError />,
        children: [
          sectionRoute("moduleB", [
            { index: true, element: <SectionData /> },
            { path: ":id", element: <p>Detalle</p> },
          ]),
        ],
      },
    ],
    { initialEntries: [path] },
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

function signIn(user: SessionUser) {
  useSessionStore.setState({ accessToken: "tok", user, status: "authenticated" });
}

let requests = 0;

beforeEach(() => {
  requests = 0;
  server.use(
    http.get(DATA_URL, () => {
      requests += 1;
      return HttpResponse.json({ nombre: "secreto de ADMIN" });
    }),
  );
});

describe("sectionRoute — la sección y todas sus subrutas bajo el mismo guard", () => {
  it("Subruta de una sección restringida: USER ve acceso denegado, ADMIN el detalle", async () => {
    signIn(USER);
    renderSection("/modulo-b/123");
    expect(await screen.findByRole("heading", { name: "Acceso denegado" })).toBeInTheDocument();
    expect(screen.queryByText("Detalle")).not.toBeInTheDocument();
  });

  it("Subruta de una sección restringida: ADMIN ve el detalle", async () => {
    signIn(ADMIN);
    renderSection("/modulo-b/123");
    expect(await screen.findByText("Detalle")).toBeInTheDocument();
  });

  it("Subruta inexistente: USER ve acceso denegado (no puede averiguar qué subrutas existen)", async () => {
    signIn(USER);
    renderSection("/modulo-b/a/b");
    expect(await screen.findByRole("heading", { name: "Acceso denegado" })).toBeInTheDocument();
  });

  it("Subruta inexistente para ADMIN: no encontrado dentro de la sección", async () => {
    signIn(ADMIN);
    renderSection("/modulo-b/a/b");
    expect(await screen.findByRole("heading", { name: "Página no encontrada" })).toBeInTheDocument();
  });

  it("Sin carga de datos sin el rol: con USER la query de la sección no se lanza", async () => {
    signIn(USER);
    renderSection("/modulo-b");
    await screen.findByRole("heading", { name: "Acceso denegado" });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(requests).toBe(0);
    expect(screen.queryByText(/secreto de ADMIN/)).not.toBeInTheDocument();
  });

  it("Con ADMIN la query de la sección sí se lanza", async () => {
    signIn(ADMIN);
    renderSection("/modulo-b");
    expect(await screen.findByText("Datos: secreto de ADMIN")).toBeInTheDocument();
    expect(requests).toBe(1);
  });
});
