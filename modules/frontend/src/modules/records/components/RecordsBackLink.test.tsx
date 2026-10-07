import { describe, expect, it, vi } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { useRecordsListStore } from "@/store/useRecordsListStore";
import { useSessionStore } from "@/store/useSessionStore";
import type { RecordResponse } from "@/modules/core/services/generated/model";
import { page, recordResponse, summary } from "../test/fixtures";
import { renderRecordRoutes } from "../test/renderRecordRoutes";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

/** Listado (3 páginas) y una historia con GET/PUT/POST. */
function mockBackend() {
  let record = recordResponse();
  server.use(
    http.get("*/api/orthodontic-records", () => HttpResponse.json(page([summary()], 1, 3))),
    http.get("*/api/orthodontic-records/:id", ({ params }) =>
      Number(params.id) === record.id
        ? HttpResponse.json(record)
        : HttpResponse.json({ type: "/errors/record-not-found", detail: "No se encontró la historia clínica." }, { status: 404 }),
    ),
    http.put("*/api/orthodontic-records/:id", async ({ request }) => {
      const body = (await request.json()) as Partial<RecordResponse>;
      record = { ...record, ...body, content: body.content ?? record.content, version: record.version + 1 } as RecordResponse;
      return HttpResponse.json(record);
    }),
    http.post("*/api/orthodontic-records", async ({ request }) => {
      const body = (await request.json()) as Partial<RecordResponse>;
      record = { ...recordResponse(), ...body, id: 10, recordNumber: "AOC-0001", version: 0 } as RecordResponse;
      return HttpResponse.json(record, { status: 201 });
    }),
  );
}

const backLink = () => screen.findByRole("link", { name: "Historias clínicas" });
const stepHeading = (title: RegExp) => screen.findByRole("heading", { level: 2, name: title });
const location = (router: { state: { location: { pathname: string; search: string } } }) =>
  `${router.state.location.pathname}${router.state.location.search}`;

describe("orthodontic-records — Volver al listado desde la historia", () => {
  it("vuelve con la búsqueda y la página aunque se haya cambiado de paso", async () => {
    mockBackend();
    const { router } = renderRecordRoutes("/historias?q=quispe&pagina=2");
    const row = await screen.findByRole("row", { name: /AOC-0001/ });

    await userEvent.click(within(row).getByRole("link", { name: "Editar historia AOC-0001" }));
    await stepHeading(/Paciente y anamnesis/);
    await userEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    await stepHeading(/Análisis facial/);

    await userEvent.click(await backLink());
    await screen.findByRole("row", { name: /AOC-0001/ });
    expect(location(router)).toBe("/historias?q=quispe&pagina=2");
  });

  it("después de crear una historia vuelve al listado con la búsqueda", async () => {
    mockBackend();
    const { router } = renderRecordRoutes("/historias?q=quispe");
    await screen.findByRole("row", { name: /AOC-0001/ });

    await act(() => router.navigate("/historias/nueva"));
    await userEvent.type(screen.getByRole("textbox", { name: "Nro. de historia" }), "AOC-0015");
    await userEvent.type(screen.getByRole("textbox", { name: "Paciente" }), "Ana Quispe");
    await userEvent.click(screen.getByRole("button", { name: /Crear historia/ }));
    await stepHeading(/Análisis facial/);

    await userEvent.click(await backLink());
    await screen.findByRole("row", { name: /AOC-0001/ });
    expect(location(router)).toBe("/historias?q=quispe");
  });

  it("después de la vista previa vuelve al listado con su búsqueda y página", async () => {
    mockBackend();
    const { router } = renderRecordRoutes("/historias?q=quispe&pagina=2");
    await screen.findByRole("row", { name: /AOC-0001/ });

    await act(() => router.navigate("/historias/10?paso=1"));
    await userEvent.click(await screen.findByRole("link", { name: "Vista previa de impresión de la historia AOC-0001" }));
    await userEvent.click(await screen.findByRole("link", { name: "Volver" }));
    await stepHeading(/Paciente y anamnesis/);

    await userEvent.click(await backLink());
    await screen.findByRole("row", { name: /AOC-0001/ });
    expect(location(router)).toBe("/historias?q=quispe&pagina=2");
  });

  it("sin listado previo en la pestaña vuelve a /historias (también en una historia nueva)", async () => {
    mockBackend();
    const { router } = renderRecordRoutes("/historias/nueva");

    expect(await backLink()).toHaveAttribute("href", "/historias");
    await userEvent.click(await backLink());
    await screen.findByRole("row", { name: /AOC-0001/ });
    expect(location(router)).toBe("/historias");
  });

  it("con cambios sin guardar pide confirmación: quedarse conserva los cambios y salir va al listado", async () => {
    mockBackend();
    const { router } = renderRecordRoutes("/historias?q=quispe");
    await screen.findByRole("row", { name: /AOC-0001/ });
    await act(() => router.navigate("/historias/10?paso=1"));
    await stepHeading(/Paciente y anamnesis/);
    await userEvent.type(screen.getByLabelText("Domicilio"), "Av. Sol 123");

    await userEvent.click(await backLink());
    expect(await screen.findByRole("alertdialog", { name: "¿Salir sin guardar?" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Seguir editando" }));
    expect(screen.getByLabelText("Domicilio")).toHaveValue("Av. Sol 123");
    expect(location(router)).toBe("/historias/10?paso=1");

    await userEvent.click(await backLink());
    await userEvent.click(await screen.findByRole("button", { name: "Salir sin guardar" }));
    await screen.findByRole("row", { name: /AOC-0001/ });
    expect(location(router)).toBe("/historias?q=quispe");
  });

  it("'Historia no encontrada' vuelve al listado recordado", async () => {
    mockBackend();
    const { router } = renderRecordRoutes("/historias?q=quispe&pagina=2");
    await screen.findByRole("row", { name: /AOC-0001/ });

    await act(() => router.navigate("/historias/99"));
    await userEvent.click(await screen.findByRole("link", { name: "Volver a las historias" }));
    await screen.findByRole("row", { name: /AOC-0001/ });
    expect(location(router)).toBe("/historias?q=quispe&pagina=2");
  });

  it("otra cuenta en la misma pestaña no hereda la búsqueda", async () => {
    mockBackend();
    const { router } = renderRecordRoutes("/historias?q=quispe");
    await screen.findByRole("row", { name: /AOC-0001/ });

    await act(() => router.navigate("/historias/10?paso=1"));
    expect(await backLink()).toHaveAttribute("href", "/historias?q=quispe");

    // Entra otra cuenta en la pestaña (p. ej. tras expirar la sesión sin cerrarla).
    act(() => useSessionStore.setState({ user: { id: 2, email: "otra@empresa.test", role: "USER", fullName: "Otra" } }));
    expect(await backLink()).toHaveAttribute("href", "/historias");
  });
});

describe("useRecordsListStore", () => {
  it("guarda solo rutas del listado y se borra con clear (cierre de sesión)", () => {
    const store = useRecordsListStore.getState();
    store.clear();
    store.setListUrl("/historias?q=quispe&pagina=2", 1);
    expect(useRecordsListStore.getState()).toMatchObject({ listUrl: "/historias?q=quispe&pagina=2", userId: 1 });
    expect(JSON.parse(sessionStorage.getItem("hsfacop.records-list") ?? "{}").state.listUrl).toBe("/historias?q=quispe&pagina=2");

    store.setListUrl("https://otro.sitio/historias", 1);
    store.setListUrl("/historias/10", 1);
    expect(useRecordsListStore.getState().listUrl).toBe("/historias?q=quispe&pagina=2");

    store.clear();
    expect(useRecordsListStore.getState()).toMatchObject({ listUrl: null, userId: null });
  });
});
