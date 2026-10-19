import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/mocks/server";
import type { CohortResponse } from "@/modules/core/services/generated/model";
import { CohortsDialog } from "./CohortsDialog";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

/** Turmas en memoria con su código y estado; registra las acciones. */
function mockCohorts() {
  const cohorts: CohortResponse[] = [
    { id: 1, name: "Turma 1", students: 3, coordinators: 1, registrationCode: "K7QM4TXR", registrationOpen: true },
    { id: 2, name: "Turma 2", students: 0, coordinators: 0, registrationCode: "P3WN8HJD", registrationOpen: true },
  ];
  const calls = { regenerated: [] as number[], registration: [] as unknown[] };
  server.use(
    http.get("*/api/cohorts", () => HttpResponse.json(cohorts)),
    http.post("*/api/cohorts/:id/registration-code", ({ params }) => {
      const cohort = cohorts.find((c) => c.id === Number(params.id))!;
      calls.regenerated.push(cohort.id);
      cohort.registrationCode = "NEWCQDE2";
      return HttpResponse.json(cohort);
    }),
    http.patch("*/api/cohorts/:id/registration", async ({ params, request }) => {
      const body = (await request.json()) as { open: boolean };
      calls.registration.push({ id: Number(params.id), ...body });
      const cohort = cohorts.find((c) => c.id === Number(params.id))!;
      cohort.registrationOpen = body.open;
      return HttpResponse.json(cohort);
    }),
  );
  return calls;
}

const rowOf = (name: string) => screen.getByText(name).closest("li") as HTMLElement;

beforeEach(() => {
  toast.success.mockClear();
});

describe("cohorts — Gestión del código y la inscripción en Turmas", () => {
  it("cada turma muestra su código en dos grupos y su estado", async () => {
    mockCohorts();
    renderWithProviders(<CohortsDialog open onOpenChange={() => {}} />);

    await screen.findByText("Turma 1");
    expect(within(rowOf("Turma 1")).getByText("K7QM-4TXR")).toBeInTheDocument();
    expect(within(rowOf("Turma 1")).getByText("Inscripción abierta")).toBeInTheDocument();
  });

  it("copiar el código: queda en el portapapeles y avisa", async () => {
    mockCohorts();
    const user = userEvent.setup();
    renderWithProviders(<CohortsDialog open onOpenChange={() => {}} />);
    await screen.findByText("Turma 1");

    await user.click(within(rowOf("Turma 1")).getByRole("button", { name: "Copiar el código de Turma 1" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Código copiado"));
    expect(await navigator.clipboard.readText()).toBe("K7QM-4TXR");
  });

  it("código nuevo: pide confirmación y solo al confirmar lo genera", async () => {
    const calls = mockCohorts();
    const user = userEvent.setup();
    renderWithProviders(<CohortsDialog open onOpenChange={() => {}} />);
    await screen.findByText("Turma 1");

    await user.click(within(rowOf("Turma 1")).getByRole("button", { name: "Generar un código nuevo para Turma 1" }));
    const confirm = await screen.findByRole("alertdialog");
    expect(within(confirm).getByText(/dejará de servir/)).toBeInTheDocument();
    expect(calls.regenerated).toEqual([]);
    await user.click(within(confirm).getByRole("button", { name: "Generar código nuevo" }));

    await waitFor(() => expect(calls.regenerated).toEqual([1]));
    expect(await within(rowOf("Turma 1")).findByText("NEWC-QDE2")).toBeInTheDocument();
  });

  it("cerrar la inscripción: muestra 'Cerrada' y la acción pasa a abrir", async () => {
    const calls = mockCohorts();
    const user = userEvent.setup();
    renderWithProviders(<CohortsDialog open onOpenChange={() => {}} />);
    await screen.findByText("Turma 2");

    await user.click(within(rowOf("Turma 2")).getByRole("button", { name: "Cerrar la inscripción de Turma 2" }));

    expect(await within(rowOf("Turma 2")).findByText("Cerrada")).toBeInTheDocument();
    expect(within(rowOf("Turma 2")).getByRole("button", { name: "Abrir la inscripción de Turma 2" })).toBeInTheDocument();
    expect(calls.registration).toEqual([{ id: 2, open: false }]);
  });
});
