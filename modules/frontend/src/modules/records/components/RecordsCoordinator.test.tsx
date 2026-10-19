import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { page, recordResponse, summary } from "../test/fixtures";
import { renderRecordRoutes } from "../test/renderRecordRoutes";

const COHORTS = [
  { id: 1, name: "Turma 1" },
  { id: 2, name: "Turma 2" },
];

/** Listado de la coordinación: registra la turma pedida y responde según ella. */
function mockCoordinatorList() {
  const cohortIds: (string | null)[] = [];
  server.use(
    http.get("*/api/cohorts", () => HttpResponse.json(COHORTS)),
    http.get("*/api/orthodontic-records", ({ request }) => {
      const cohortId = new URL(request.url).searchParams.get("cohortId");
      cohortIds.push(cohortId);
      const rows =
        cohortId === "2"
          ? [summary({ id: 12, recordNumber: "AEO-0003", patientName: "Rosa Mamani", authorName: "Bea Alumna", cohortName: "Turma 2" })]
          : [
              summary({ authorName: "Ana Alumna", cohortName: "Turma 1" }),
              summary({ id: 12, recordNumber: "AEO-0003", patientName: "Rosa Mamani", authorName: "Bea Alumna", cohortName: "Turma 2" }),
            ];
      return HttpResponse.json(page(rows));
    }),
  );
  return cohortIds;
}

describe("cohorts — Historias de las turmas en solo lectura", () => {
  it("Listado de la coordinación: columnas Alumno y Turma, sin 'Nueva historia' ni cupo", async () => {
    mockCoordinatorList();
    renderRecordRoutes("/historias", "COORDINATOR");

    const row = await screen.findByRole("row", { name: /AEO-0001/ });
    expect(screen.getByRole("columnheader", { name: "Alumno" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Turma" })).toBeInTheDocument();
    expect(within(row).getByRole("cell", { name: "Ana Alumna" })).toBeInTheDocument();
    expect(within(row).getByRole("cell", { name: "Turma 1" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Nueva historia/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/cupo/i)).not.toBeInTheDocument();
  });

  it("Abrir una historia: el paciente abre la vista preliminar y no hay 'Editar'", async () => {
    mockCoordinatorList();
    renderRecordRoutes("/historias", "COORDINATOR");

    const row = await screen.findByRole("row", { name: /AEO-0001/ });
    expect(within(row).getByRole("link", { name: "Ana Quispe" })).toHaveAttribute("href", "/historias/10/imprimir");
    expect(within(row).queryByRole("link", { name: /Editar historia/ })).not.toBeInTheDocument();
  });

  it("Filtrar por turma: envía la turma elegida al servidor", async () => {
    const cohortIds = mockCoordinatorList();
    renderRecordRoutes("/historias", "COORDINATOR");
    await screen.findByRole("row", { name: /AEO-0001/ });

    await userEvent.click(screen.getByRole("combobox", { name: "Filtrar por turma" }));
    await userEvent.click(await screen.findByRole("option", { name: "Turma 2" }));

    expect(await screen.findByRole("cell", { name: "Bea Alumna" })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /AEO-0001/ })).not.toBeInTheDocument();
    expect(cohortIds).toContain("2");
  });

  it("Vista preliminar sin 'Imprimir', 'Volver' al listado y ayuda de solo lectura", async () => {
    let printed = 0;
    server.use(
      http.get("*/api/orthodontic-records/:id", () => HttpResponse.json(recordResponse())),
      http.post("*/api/orthodontic-records/:id/print", () => {
        printed += 1;
        return HttpResponse.json({});
      }),
    );
    renderRecordRoutes("/historias/10/imprimir", "COORDINATOR");

    expect(await screen.findByText("Historia AEO-0001 en solo lectura: la imprime su autor.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Imprimir/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver/ })).toHaveAttribute("href", "/historias");
    expect(printed).toBe(0);
  });

  it("Historia fuera de sus turmas: 'Historia no encontrada'", async () => {
    server.use(
      http.get("*/api/orthodontic-records/:id", () =>
        HttpResponse.json({ type: "/errors/record-not-found", detail: "No se encontró la historia clínica." }, { status: 404 }),
      ),
    );
    renderRecordRoutes("/historias/99/imprimir", "COORDINATOR");

    expect(await screen.findByText(/Historia no encontrada/)).toBeInTheDocument();
  });
});
