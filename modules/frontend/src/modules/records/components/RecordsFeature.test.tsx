import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { page, recordResponse, summary } from "../test/fixtures";
import { renderRecordRoutes } from "../test/renderRecordRoutes";
import { useRecordsSearchStore } from "@/store/useRecordsSearchStore";

/**
 * Backend de listado: sin texto responde el `GET`; con texto, el `POST /search` (el texto va en el
 * cuerpo). Registra el texto pedido (`null` = listado sin búsqueda) y las URL de las peticiones.
 */
function mockList(respond: (q: string | null) => ReturnType<typeof page>) {
  console.log('MOCKLIST CALLED');
  const queries: (string | null)[] = [];
  const urls: string[] = [];
  console.log('LIST', server.listHandlers().length);
  server.events.on('request:unhandled', ({request}) => console.log('UNHANDLED', request.method, request.url));
  server.events.on('request:match', ({request}) => console.log('MATCH', request.method, request.url));
  server.use(
    http.get("*/api/orthodontic-records", ({ request }) => {
      console.log('HIT GET');
      urls.push(request.url);
      queries.push(null);
      return HttpResponse.json(respond(null));
    }),
    http.post("*/api/orthodontic-records/search", async ({ request }) => {
      urls.push(request.url);
      const { q } = (await request.json()) as { q: string };
      queries.push(q);
      return HttpResponse.json(respond(q));
    }),
  );
  return Object.assign(queries, { urls });
}

describe("orthodontic-records — Listado y búsqueda de historias", () => {
  it("USER ve sus historias sin la columna Autor", async () => {
    mockList(() => page([summary({ documentType: "DNI", documentNumber: "74125896", treatmentStartDate: "2026-05-19" })]));
    renderRecordRoutes("/historias", "USER");

    const row = await screen.findByRole("row", { name: /AEO-0001/ });
    expect(within(row).getByText("Ana Quispe")).toBeInTheDocument();
    expect(within(row).getByText("DNI 74125896")).toBeInTheDocument();
    expect(within(row).getByText("19/05/2026")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Autor" })).not.toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "Vista previa de impresión de la historia AEO-0001" })).toHaveAttribute("href", "/historias/10/imprimir");
    expect(within(row).getByRole("link", { name: "Editar historia AEO-0001" })).toHaveAttribute("href", "/historias/10");
  });

  it("ADMIN ve las historias de todos con la columna Autor", async () => {
    mockList(() => page([summary({ authorName: "Dr. Carlos Medina" })]));
    renderRecordRoutes("/historias", "ADMIN");

    expect(await screen.findByRole("columnheader", { name: "Autor" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Dr. Carlos Medina" })).toBeInTheDocument();
  });

  it("busca mientras se escribe (con espera) y envía el término al servidor", async () => {
    const queries = mockList((q) => page(q ? [summary({ patientName: "Ana QUÍSPE" })] : [summary(), summary({ id: 11, recordNumber: "AEO-0002" })]));
    renderRecordRoutes("/historias");
    await screen.findByRole("row", { name: /AEO-0002/ });

    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar historias" }), "quispe");

    expect(await screen.findByText("Ana QUÍSPE")).toBeInTheDocument();
    expect(queries).toContain("quispe");
    expect(queries.filter((q) => q !== null && q !== "quispe")).toEqual([]);
    // Scenario "Buscar por nombre": ninguna URL de la API lleva el texto.
    expect(queries.urls.filter((u) => u.includes("quispe"))).toEqual([]);
  });

  it("sin resultados: estado vacío con 'Limpiar búsqueda'", async () => {
    mockList((q) => page(q ? [] : [summary()]));
    renderRecordRoutes("/historias");
    await screen.findByRole("row", { name: /AEO-0001/ });

    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar historias" }), "zzz");
    expect(await screen.findByText("No hay historias que coincidan.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    expect(await screen.findByRole("row", { name: /AEO-0001/ })).toBeInTheDocument();
  });

  it("sin historias todavía: botón 'Nueva historia'", async () => {
    mockList(() => page([]));
    renderRecordRoutes("/historias");
    expect(await screen.findByText("Todavía no hay historias clínicas.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Nueva historia/ }).length).toBeGreaterThanOrEqual(1);
  });

  it("error al cargar: mensaje y 'Reintentar'", async () => {
    let fail = true;
    server.use(
      http.get("*/api/orthodontic-records", () =>
        fail
          ? HttpResponse.json({ detail: "Ocurrió un error inesperado." }, { status: 500 })
          : HttpResponse.json(page([summary()])),
      ),
    );
    renderRecordRoutes("/historias");
    expect(await screen.findByText("Ocurrió un error inesperado.")).toBeInTheDocument();

    fail = false;
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(screen.getByRole("row", { name: /AEO-0001/ })).toBeInTheDocument());
  });
  it("la página queda en la URL y el texto buscado no", async () => {
    mockList((q) => page([summary({ patientName: q ? "Ana QUÍSPE" : "Ana Quispe" })], 0, 3));
    const { router } = renderRecordRoutes("/historias");
    await screen.findByRole("row", { name: /AEO-0001/ });

    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar historias" }), "quispe");
    await screen.findByText("Ana QUÍSPE");
    expect(router.state.location.search).toBe("");

    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() => expect(router.state.location.search).toBe("?pagina=2"));
    expect(router.state.location.search).not.toContain("quispe");
    expect(screen.getByRole("searchbox", { name: "Buscar historias" })).toHaveValue("quispe");
  });

  it("la búsqueda de otra cuenta en la misma pestaña no se hereda", async () => {
    const queries = mockList((q) => page([summary({ patientName: q ? "Ana QUÍSPE" : "Ana Quispe" })]));
    useRecordsSearchStore.getState().setText("quispe", 99);
    renderRecordRoutes("/historias");

    await screen.findByRole("row", { name: /AEO-0001/ });
    expect(screen.getByRole("searchbox", { name: "Buscar historias" })).toHaveValue("");
    expect([...queries]).toEqual([null]);
  });

  it("limpiar la búsqueda borra el texto guardado en la pestaña", async () => {
    mockList((q) => page(q ? [] : [summary()]));
    renderRecordRoutes("/historias");
    await screen.findByRole("row", { name: /AEO-0001/ });

    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar historias" }), "zzz");
    await userEvent.click(await screen.findByRole("button", { name: "Limpiar búsqueda" }));
    await screen.findByRole("row", { name: /AEO-0001/ });

    expect(useRecordsSearchStore.getState().text).toBe("");
    expect(JSON.parse(sessionStorage.getItem("hsfacop.records-search") ?? "{}").state.text).toBe("");
  });

  it("la vista previa se abre en la misma pestaña y 'Volver' regresa al listado con su búsqueda", async () => {
    mockList((q) => page(q ? [summary({ patientName: "Ana QUÍSPE" })] : [summary()]));
    server.use(http.get("*/api/orthodontic-records/:id", () => HttpResponse.json(recordResponse())));
    useRecordsSearchStore.getState().setText("quispe", 1);
    const { router } = renderRecordRoutes("/historias");

    const row = await screen.findByRole("row", { name: /AEO-0001/ });
    expect(screen.getByRole("searchbox", { name: "Buscar historias" })).toHaveValue("quispe");
    const preview = within(row).getByRole("link", { name: "Vista previa de impresión de la historia AEO-0001" });
    expect(preview).not.toHaveAttribute("target");

    await userEvent.click(preview);
    await screen.findAllByRole("article");
    expect(router.state.location.pathname).toBe("/historias/10/imprimir");

    await userEvent.click(screen.getByRole("link", { name: "Volver" }));
    await screen.findByText("Ana QUÍSPE");
    expect(router.state.location.search).toBe("");
    expect(screen.getByRole("searchbox", { name: "Buscar historias" })).toHaveValue("quispe");
  });
  it("'Editar' abre la historia en el formulario, paso 1", async () => {
    mockList(() => page([summary()]));
    server.use(http.get("*/api/orthodontic-records/:id", () => HttpResponse.json(recordResponse())));
    const { router } = renderRecordRoutes("/historias");

    const row = await screen.findByRole("row", { name: /AEO-0001/ });
    await userEvent.click(within(row).getByRole("link", { name: "Editar historia AEO-0001" }));

    expect(await screen.findByRole("heading", { level: 2, name: /Paciente y anamnesis/ })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/historias/10");
  });
});

describe("orthodontic-records — Listado en celular y tablet", () => {
  afterEach(() => vi.unstubAllGlobals());

  /** Pantalla de menos de 1024 px: la media query de escritorio no se cumple. */
  function narrowScreen() {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  }

  it("bajo 1024 px cada historia es una tarjeta con sus datos y sus acciones visibles", async () => {
    narrowScreen();
    mockList(() => page([summary({ documentType: "DNI", documentNumber: "74125896", treatmentStartDate: "2026-05-19" })]));
    renderRecordRoutes("/historias", "USER");

    const list = await screen.findByRole("list", { name: "Historias clínicas" });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    const card = within(list).getAllByRole("listitem")[0];
    expect(within(card).getByText("AEO-0001")).toBeInTheDocument();
    expect(within(card).getByRole("heading", { name: "Ana Quispe" })).toBeInTheDocument();
    expect(within(card).getByText("DNI 74125896")).toBeInTheDocument();
    expect(within(card).getByText("19/05/2026")).toBeInTheDocument();
    expect(within(card).queryByText("Autor")).not.toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Editar historia AEO-0001" })).toHaveAttribute("href", "/historias/10");
    expect(within(card).getByRole("link", { name: "Vista previa de impresión de la historia AEO-0001" })).toHaveAttribute("href", "/historias/10/imprimir");
  });

  it("ADMIN ve el autor en cada tarjeta", async () => {
    narrowScreen();
    mockList(() => page([summary({ authorName: "Dr. Carlos Medina" })]));
    renderRecordRoutes("/historias", "ADMIN");

    const card = (await screen.findAllByRole("listitem"))[0];
    expect(within(card).getByText("Autor")).toBeInTheDocument();
    expect(within(card).getByText("Dr. Carlos Medina")).toBeInTheDocument();
  });
});

/** Cupo del tratante autenticado (reemplaza el "sin límite" global). */
function mockQuota(limit: number | null, used: number) {
  server.use(
    http.get("*/api/orthodontic-records/quota", () =>
      HttpResponse.json({ limit, used, reached: limit != null && used >= limit }),
    ),
  );
}

const QUOTA_FULL = "Alcanzaste el máximo de 5 historias clínicas. Comunícate con el administrador para solicitar más.";

describe("orthodontic-records — Cupo de historias en el listado", () => {
  it("sin cupo: no muestra el uso y 'Nueva historia' está disponible", async () => {
    mockList(() => page([summary()]));
    renderRecordRoutes("/historias", "USER");
    await screen.findByRole("row", { name: /AEO-0001/ });

    expect(screen.queryByText(/de \d+ historias/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nueva historia/ })).toHaveAttribute("href", "/historias/nueva");
  });

  it("por debajo del cupo: muestra 'N de M historias' y se puede crear", async () => {
    mockQuota(5, 3);
    mockList(() => page([summary()]));
    renderRecordRoutes("/historias", "USER");

    expect(await screen.findByText("3 de 5 historias")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nueva historia/ })).toHaveAttribute("href", "/historias/nueva");
    expect(screen.queryByText(QUOTA_FULL)).not.toBeInTheDocument();
  });

  it("cupo lleno: 'Nueva historia' deshabilitado y el aviso visible", async () => {
    mockQuota(5, 5);
    mockList(() => page([summary()]));
    renderRecordRoutes("/historias", "USER");

    expect(await screen.findByText(QUOTA_FULL)).toBeInTheDocument();
    expect(screen.getByText("5 de 5 historias")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Nueva historia/ });
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).not.toHaveAttribute("href");
  });

  it("cupo 0 sin historias: el botón del estado vacío también queda deshabilitado", async () => {
    mockQuota(0, 0);
    mockList(() => page([]));
    renderRecordRoutes("/historias", "USER");

    expect(await screen.findByText("Todavía no hay historias clínicas.")).toBeInTheDocument();
    await waitFor(() =>
      screen.getAllByRole("link", { name: /Nueva historia/ }).forEach((link) => expect(link).toHaveAttribute("aria-disabled", "true")),
    );
    expect(screen.getByText(/Alcanzaste el máximo de 0 historias clínicas/)).toBeInTheDocument();
  });

  it("ADMIN no ve uso de cupo", async () => {
    mockList(() => page([summary()]));
    renderRecordRoutes("/historias", "ADMIN");
    await screen.findByRole("row", { name: /AEO-0001/ });

    expect(screen.queryByText(/de \d+ historias/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nueva historia/ })).toHaveAttribute("href", "/historias/nueva");
  });
});
