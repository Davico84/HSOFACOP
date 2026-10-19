import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/mocks/server";
import type { CohortResponse, UserSummaryResponse } from "@/modules/core/services/generated/model";
import { UsersFeature } from "./UsersFeature";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const ANA: UserSummaryResponse = {
  id: 2, email: "ana@empresa.test", fullName: "Ana Pérez", role: "USER", status: "ACTIVE",
  recordQuota: 5, recordCount: 0, coordinatorCohorts: [],
  phone: "987654321", documentType: "DNI", documentNumber: "74125896",
};
const CARLA: UserSummaryResponse = {
  id: 3, email: "carla@empresa.test", fullName: "Carla Ruiz", role: "COORDINATOR", status: "ACTIVE",
  recordQuota: null, recordCount: 0, coordinatorCohorts: [{ id: 1, name: "Turma 1" }],
};

/** Backend en memoria de cuentas y turmas; registra los cuerpos enviados. */
function mockBackend() {
  const users = new Map<number, UserSummaryResponse>([ANA, CARLA].map((u) => [u.id, structuredClone(u)]));
  const cohorts: CohortResponse[] = [
    { id: 1, name: "Turma 1", students: 0, coordinators: 1 },
    { id: 2, name: "Turma 2", students: 0, coordinators: 0 },
  ];
  const calls = { cohort: [] as unknown[], role: [] as unknown[], created: [] as unknown[] };
  const nameOf = (id: number) => cohorts.find((c) => c.id === id)!.name;
  server.use(
    http.get("*/api/users", () =>
      HttpResponse.json({ content: [...users.values()], page: 0, size: 20, totalElements: users.size, totalPages: 1, last: true }),
    ),
    http.get("*/api/cohorts", () => HttpResponse.json(cohorts)),
    http.post("*/api/cohorts", async ({ request }) => {
      const { name } = (await request.json()) as { name: string };
      calls.created.push(name);
      if (cohorts.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
        return HttpResponse.json(
          { type: "/errors/cohort-name-taken", detail: "Ya existe una turma con ese nombre." },
          { status: 409 },
        );
      }
      const created = { id: cohorts.length + 1, name: name.trim(), students: 0, coordinators: 0 };
      cohorts.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),
    http.patch("*/api/users/:id/cohort", async ({ params, request }) => {
      const body = (await request.json()) as { cohortId: number | null };
      calls.cohort.push(body);
      const user = users.get(Number(params.id))!;
      user.cohort = body.cohortId == null ? undefined : { id: body.cohortId, name: nameOf(body.cohortId) };
      return HttpResponse.json(user);
    }),
    http.patch("*/api/users/:id/role", async ({ params, request }) => {
      const body = (await request.json()) as { role: "USER" | "COORDINATOR"; cohortIds: number[] };
      calls.role.push(body);
      const user = users.get(Number(params.id))!;
      user.role = body.role;
      user.cohort = undefined;
      user.recordQuota = body.role === "COORDINATOR" ? null : 5;
      user.coordinatorCohorts = body.role === "COORDINATOR" ? body.cohortIds.map((id) => ({ id, name: nameOf(id) })) : [];
      return HttpResponse.json(user);
    }),
  );
  return calls;
}

const row = (name: string) => screen.getByRole("row", { name: new RegExp(name) });

beforeEach(() => {
  toast.success.mockClear();
  toast.error.mockClear();
});

describe("users — turmas y coordinación en la pantalla Usuarios", () => {
  it("Asignar la turma desde la lista: la fila muestra la turma elegida", async () => {
    const calls = mockBackend();
    renderWithProviders(<UsersFeature />);
    await screen.findByRole("row", { name: /Ana Pérez/ });

    await userEvent.click(within(row("Ana Pérez")).getByRole("combobox", { name: "Turma de Ana Pérez" }));
    await userEvent.click(await screen.findByRole("option", { name: "Turma 2" }));

    await waitFor(() =>
      expect(within(row("Ana Pérez")).getByRole("combobox", { name: "Turma de Ana Pérez" })).toHaveTextContent("Turma 2"),
    );
    expect(calls.cohort).toEqual([{ cohortId: 2 }]);
  });

  it("Convertir en coordinación: la fila muestra 'Coordinación' y sus turmas, sin cupo ni turma de alumno", async () => {
    const calls = mockBackend();
    renderWithProviders(<UsersFeature />);
    await screen.findByRole("row", { name: /Ana Pérez/ });

    await userEvent.click(within(row("Ana Pérez")).getByRole("button", { name: /Convertir en coordinación/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Convertir" })).toBeDisabled();
    await userEvent.click(within(dialog).getByRole("checkbox", { name: "Turma 1" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Convertir" }));

    await waitFor(() => expect(within(row("Ana Pérez")).getByText("Coordinación")).toBeInTheDocument());
    expect(within(row("Ana Pérez")).getByText("Turma 1")).toBeInTheDocument();
    expect(within(row("Ana Pérez")).queryByRole("button", { name: /cupo/ })).not.toBeInTheDocument();
    expect(within(row("Ana Pérez")).queryByRole("combobox")).not.toBeInTheDocument();
    expect(calls.role).toEqual([{ role: "COORDINATOR", cohortIds: [1] }]);
  });

  it("Cuenta con historias: 'Convertir en coordinación' no disponible y explica por qué", async () => {
    mockBackend();
    server.use(
      http.get("*/api/users", () =>
        HttpResponse.json({ content: [{ ...ANA, recordCount: 1 }], page: 0, size: 10, totalElements: 1, totalPages: 1, last: true }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<UsersFeature />);
    await screen.findByRole("row", { name: /Ana Pérez/ });

    const convert = within(row("Ana Pérez")).getByRole("button", { name: /Convertir en coordinación/ });
    expect(convert).toHaveAttribute("aria-disabled", "true");
    await user.hover(convert);
    expect(await screen.findByRole("tooltip", { name: /no puede pasar a coordinación/ })).toBeInTheDocument();

    await user.click(convert);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Volver a alumno tras confirmar", async () => {
    const calls = mockBackend();
    renderWithProviders(<UsersFeature />);
    await screen.findByRole("row", { name: /Carla Ruiz/ });

    await userEvent.click(within(row("Carla Ruiz")).getByRole("button", { name: /Volver a alumno/ }));
    await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Volver a alumno" }));

    await waitFor(() => expect(within(row("Carla Ruiz")).getByText("Alumno")).toBeInTheDocument());
    expect(calls.role).toEqual([{ role: "USER", cohortIds: [] }]);
  });

  it("Gestionar turmas: crear 'Turma 3' la deja disponible; un nombre repetido muestra el error", async () => {
    const calls = mockBackend();
    renderWithProviders(<UsersFeature />);
    await screen.findByRole("row", { name: /Ana Pérez/ });

    await userEvent.click(screen.getByRole("button", { name: "Turmas" }));
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByText("Turma 1");

    await userEvent.type(within(dialog).getByLabelText("Nueva turma"), " turma 1 ");
    await userEvent.click(within(dialog).getByRole("button", { name: "Crear" }));
    expect(await within(dialog).findByText("Ya existe una turma con ese nombre.")).toBeInTheDocument();

    await userEvent.clear(within(dialog).getByLabelText("Nueva turma"));
    await userEvent.type(within(dialog).getByLabelText("Nueva turma"), "Turma 3");
    await userEvent.click(within(dialog).getByRole("button", { name: "Crear" }));

    expect(await within(dialog).findByText("Turma 3")).toBeInTheDocument();
    expect(calls.created).toEqual(["turma 1", "Turma 3"]);
  });

  it("Ver datos: muestra celular y 'Sin registrar' en lo que falta, sin campos editables", async () => {
    mockBackend();
    const user = userEvent.setup();
    renderWithProviders(<UsersFeature />);
    await screen.findByRole("row", { name: /Ana Pérez/ });

    await user.click(within(row("Ana Pérez")).getByRole("button", { name: "Ver los datos de Ana Pérez" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("987654321")).toBeInTheDocument();
    expect(within(dialog).getByText("DNI 74125896")).toBeInTheDocument();
    expect(within(dialog).getByText("Sin registrar")).toBeInTheDocument();
    expect(within(dialog).queryByRole("textbox")).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Copiar celular" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Celular copiado"));
    expect(await navigator.clipboard.readText()).toBe("987654321");
  });

  it("nombre vacío: el formulario lo rechaza sin enviar nada", async () => {
    const calls = mockBackend();
    renderWithProviders(<UsersFeature />);
    await screen.findByRole("row", { name: /Ana Pérez/ });

    await userEvent.click(screen.getByRole("button", { name: "Turmas" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Crear" }));

    expect(await within(dialog).findByText("Indica el nombre de la turma.")).toBeInTheDocument();
    expect(calls.created).toEqual([]);
  });
});
