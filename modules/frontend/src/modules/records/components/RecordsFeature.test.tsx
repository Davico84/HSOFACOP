import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { page, recordResponse, summary } from "../test/fixtures";
import { renderRecordRoutes } from "../test/renderRecordRoutes";

/** Backend de listado: registra la búsqueda pedida y responde según ella. */
function mockList(respond: (q: string | null) => ReturnType<typeof page>) {
  const queries: (string | null)[] = [];
  server.use(
    http.get("*/api/orthodontic-records", ({ request }) => {
      const q = new URL(request.url).searchParams.get("q");
      queries.push(q);
      return HttpResponse.json(respond(q));
    }),
  );
  return queries;
}

describe("orthodontic-records — Listado y búsqueda de historias", () => {
  it("USER ve sus historias sin la columna Autor", async () => {
    mockList(() => page([summary({ documentType: "DNI", documentNumber: "74125896", treatmentStartDate: "2026-05-19" })]));
    renderRecordRoutes("/historias", "USER");

    const row = await screen.findByRole("row", { name: /AEO-001/ });
    expect(within(row).getByText("Ana Quispe")).toBeInTheDocument();
    expect(within(row).getByText("DNI 74125896")).toBeInTheDocument();
    expect(within(row).getByText("19/05/2026")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Autor" })).not.toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "Vista previa de impresión de la historia AEO-001" })).toHaveAttribute("href", "/historias/10/imprimir");
    expect(within(row).getByRole("link", { name: "Editar historia AEO-001" })).toHaveAttribute("href", "/historias/10?paso=1");
  });

  it("ADMIN ve las historias de todos con la columna Autor", async () => {
    mockList(() => page([summary({ authorName: "Dr. Carlos Medina" })]));
    renderRecordRoutes("/historias", "ADMIN");

    expect(await screen.findByRole("columnheader", { name: "Autor" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Dr. Carlos Medina" })).toBeInTheDocument();
  });

  it("busca mientras se escribe (con espera) y envía el término al servidor", async () => {
    const queries = mockList((q) => page(q ? [summary({ patientName: "Ana QUÍSPE" })] : [summary(), summary({ id: 11, recordNumber: "AEO-002" })]));
    renderRecordRoutes("/historias");
    await screen.findByRole("row", { name: /AEO-002/ });

    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar historias" }), "quispe");

    expect(await screen.findByText("Ana QUÍSPE")).toBeInTheDocument();
    expect(queries).toContain("quispe");
    expect(queries.filter((q) => q !== null && q !== "quispe")).toEqual([]);
  });

  it("sin resultados: estado vacío con 'Limpiar búsqueda'", async () => {
    mockList((q) => page(q ? [] : [summary()]));
    renderRecordRoutes("/historias");
    await screen.findByRole("row", { name: /AEO-001/ });

    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar historias" }), "zzz");
    expect(await screen.findByText("No hay historias que coincidan.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    expect(await screen.findByRole("row", { name: /AEO-001/ })).toBeInTheDocument();
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
    await waitFor(() => expect(screen.getByRole("row", { name: /AEO-001/ })).toBeInTheDocument());
  });
  it("la búsqueda y la página quedan en la URL", async () => {
    mockList((q) => page([summary({ patientName: q ? "Ana QUÍSPE" : "Ana Quispe" })], 0, 3));
    const { router } = renderRecordRoutes("/historias");
    await screen.findByRole("row", { name: /AEO-001/ });

    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar historias" }), "quispe");
    await screen.findByText("Ana QUÍSPE");
    expect(router.state.location.search).toBe("?q=quispe");

    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() => expect(router.state.location.search).toBe("?q=quispe&pagina=2"));
  });

  it("la vista previa se abre en la misma pestaña y 'Volver' regresa al listado con su búsqueda", async () => {
    mockList((q) => page(q ? [summary({ patientName: "Ana QUÍSPE" })] : [summary()]));
    server.use(http.get("*/api/orthodontic-records/:id", () => HttpResponse.json(recordResponse())));
    const { router } = renderRecordRoutes("/historias?q=quispe");

    const row = await screen.findByRole("row", { name: /AEO-001/ });
    expect(screen.getByRole("searchbox", { name: "Buscar historias" })).toHaveValue("quispe");
    const preview = within(row).getByRole("link", { name: "Vista previa de impresión de la historia AEO-001" });
    expect(preview).not.toHaveAttribute("target");

    await userEvent.click(preview);
    await screen.findAllByRole("article");
    expect(router.state.location.pathname).toBe("/historias/10/imprimir");

    await userEvent.click(screen.getByRole("link", { name: "Volver" }));
    await screen.findByText("Ana QUÍSPE");
    expect(router.state.location.search).toBe("?q=quispe");
    expect(screen.getByRole("searchbox", { name: "Buscar historias" })).toHaveValue("quispe");
  });
  it("'Editar' abre la historia en el formulario, paso 1", async () => {
    mockList(() => page([summary()]));
    server.use(http.get("*/api/orthodontic-records/:id", () => HttpResponse.json(recordResponse())));
    const { router } = renderRecordRoutes("/historias");

    const row = await screen.findByRole("row", { name: /AEO-001/ });
    await userEvent.click(within(row).getByRole("link", { name: "Editar historia AEO-001" }));

    expect(await screen.findByRole("heading", { level: 2, name: /Paciente y anamnesis/ })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/historias/10");
  });
});
