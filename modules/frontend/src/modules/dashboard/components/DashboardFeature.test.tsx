import { describe, it, expect, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/mocks/server";
import { useSessionStore, type Role } from "@/store/useSessionStore";
import type { AdminDashboardResponse, UserDashboardResponse } from "@/modules/core/services/generated/model";
import { DashboardFeature } from "./DashboardFeature";

function signIn(role: Role) {
  useSessionStore.setState({
    accessToken: "tok",
    user: { id: 1, email: "ana@empresa.test", role, fullName: "Ana Pérez" },
    status: "authenticated",
  });
}

const EMPTY_STEPS = [1, 2, 3, 4, 5, 6, 7].map((step) => ({ step, count: 0 }));

function userDashboard(overrides: Partial<UserDashboardResponse> = {}): UserDashboardResponse {
  return {
    records: { total: 3, createdThisMonth: 1 },
    quota: { limit: 5, used: 3, reached: false },
    completeness: { complete: 1, inProgress: 1, notComputed: 1, averageFilledSteps: 5.5 },
    missing: {
      withoutDocument: 2,
      withoutBirthDate: 0,
      withoutTreatmentStart: 1,
      emptySteps: [
        { step: 5, count: 2 },
        { step: 6, count: 2 },
        { step: 7, count: 1 },
        { step: 1, count: 0 },
        { step: 2, count: 0 },
        { step: 3, count: 0 },
        { step: 4, count: 0 },
      ],
    },
    resume: [
      { id: 12, recordNumber: "AEO-003", patientName: "Luis Rojas", lastStep: 6, filledSteps: 4, updatedAt: "2026-10-04T15:00:00Z" },
      { id: 11, recordNumber: "AEO-002", patientName: "Rosa Díaz", updatedAt: "2026-10-03T15:00:00Z" },
    ],
    ...overrides,
  };
}

function adminDashboard(overrides: Partial<AdminDashboardResponse> = {}): AdminDashboardResponse {
  return {
    users: { total: 12, active: 10, disabled: 2, newThisMonth: 3 },
    records: {
      total: 40,
      createdThisMonth: 7,
      complete: 20,
      inProgress: 15,
      notComputed: 5,
      perMonth: [
        { month: "2026-05", count: 4 },
        { month: "2026-06", count: 0 },
        { month: "2026-07", count: 0 },
        { month: "2026-08", count: 0 },
        { month: "2026-09", count: 0 },
        { month: "2026-10", count: 7 },
      ],
    },
    topAuthors: [
      { userId: 2, fullName: "Dra. Torres", status: "ACTIVE", records: 9, averageFilledSteps: 6.2 },
      { userId: 3, fullName: "Dr. Medina", status: "DISABLED", records: 5 },
    ],
    quotas: {
      total: 14,
      items: [
        { userId: 4, fullName: "Dr. Lleno", used: 5, limit: 5, reached: true },
        { userId: 5, fullName: "Dra. Cerca", used: 4, limit: 5, reached: false },
      ],
    },
    unlockRequests: { total: 0, items: [] },
    ...overrides,
  };
}

function mockUser(data: UserDashboardResponse) {
  server.use(http.get("*/api/dashboard/me", () => HttpResponse.json(data)));
}

function mockAdmin(data: AdminDashboardResponse) {
  server.use(http.get("*/api/dashboard/admin", () => HttpResponse.json(data)));
}

beforeEach(() => signIn("USER"));

describe("dashboard — Métricas del tratante en Inicio", () => {
  it("Historias y cupo, completitud y aviso de historias sin calcular", async () => {
    mockUser(userDashboard());
    renderWithProviders(<DashboardFeature />);

    expect(screen.getByRole("heading", { level: 1, name: "Hola, Ana Pérez" })).toBeInTheDocument();
    expect(await screen.findByText("3 de 5")).toBeInTheDocument();
    expect(screen.getByText("1 creadas este mes")).toBeInTheDocument();
    expect(screen.getByText("1 en progreso")).toBeInTheDocument();
    expect(screen.getByText("5,5")).toBeInTheDocument();
    expect(screen.getByText("1 historia sin calcular: se calculan al volver a guardarlas.")).toBeInTheDocument();
  });

  it("Sin límite de cupo", async () => {
    mockUser(userDashboard({ quota: { limit: null, used: 3, reached: false } }));
    renderWithProviders(<DashboardFeature />);
    expect(await screen.findByText("Sin límite")).toBeInTheDocument();
  });

  it("Promedio sin historias calculadas se muestra '—'", async () => {
    mockUser(userDashboard({ completeness: { complete: 0, inProgress: 0, notComputed: 3, averageFilledSteps: null } }));
    renderWithProviders(<DashboardFeature />);
    expect(await screen.findByText("—")).toBeInTheDocument();
  });

  it("Datos faltantes y pasos vacíos en el orden del servidor, con su valor visible", async () => {
    mockUser(userDashboard());
    renderWithProviders(<DashboardFeature />);

    const card = (await screen.findByRole("heading", { name: "Datos faltantes" })).closest("div")!;
    expect(within(card).getByText("Sin documento").nextSibling).toHaveTextContent("2");
    expect(within(card).getByText("Sin fecha de inicio de tratamiento").nextSibling).toHaveTextContent("1");
    const steps = within(card).getAllByRole("listitem").filter((li) => /^\d\./.test(li.textContent ?? ""));
    expect(steps.map((li) => li.textContent?.slice(0, 2))).toEqual(["5.", "6.", "7.", "1.", "2.", "3.", "4."]);
    expect(steps[0]).toHaveTextContent("5. Análisis de modelos2 historias");
  });

  it("Para retomar: abre en el último paso, o en el paso 1 si no tiene", async () => {
    mockUser(userDashboard());
    renderWithProviders(<DashboardFeature />);

    expect(await screen.findByRole("link", { name: "Retomar historia AEO-003 en el paso 6" })).toHaveAttribute(
      "href",
      "/historias/12?paso=6",
    );
    expect(screen.getByRole("link", { name: "Retomar historia AEO-002 en el paso 1" })).toHaveAttribute(
      "href",
      "/historias/11?paso=1",
    );
    expect(screen.getByText(/4 de 7 pasos con datos/)).toBeInTheDocument();
    expect(screen.getByText(/Sin calcular ·/)).toBeInTheDocument();
  });

  it("Todas completas: 'Para retomar' indica que no hay pendientes", async () => {
    mockUser(userDashboard({ resume: [] }));
    renderWithProviders(<DashboardFeature />);
    expect(await screen.findByText(/No tienes historias pendientes/)).toBeInTheDocument();
  });

  it("Sin historias todavía: invitación a crear la primera", async () => {
    mockUser(
      userDashboard({
        records: { total: 0, createdThisMonth: 0 },
        completeness: { complete: 0, inProgress: 0, notComputed: 0, averageFilledSteps: null },
        missing: { withoutDocument: 0, withoutBirthDate: 0, withoutTreatmentStart: 0, emptySteps: EMPTY_STEPS },
        resume: [],
      }),
    );
    renderWithProviders(<DashboardFeature />);
    expect(await screen.findByText("Todavía no tienes historias clínicas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nueva historia/ })).toHaveAttribute("href", "/historias/nueva");
  });

  it("Error al cargar: mensaje y 'Reintentar'", async () => {
    let fail = true;
    server.use(
      http.get("*/api/dashboard/me", () =>
        fail ? HttpResponse.json({ detail: "Ocurrió un error inesperado." }, { status: 500 }) : HttpResponse.json(userDashboard()),
      ),
    );
    renderWithProviders(<DashboardFeature />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    fail = false;
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("3 de 5")).toBeInTheDocument();
  });
});

describe("dashboard — Métricas globales del ADMIN en Inicio", () => {
  beforeEach(() => signIn("ADMIN"));

  it("Usuarios e historias", async () => {
    mockAdmin(adminDashboard());
    renderWithProviders(<DashboardFeature />);

    expect(await screen.findByText("10 activas · 2 deshabilitadas")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("7 creadas este mes")).toBeInTheDocument();
    expect(screen.getByText("15 en progreso")).toBeInTheDocument();
    expect(screen.getByText("5 historias sin calcular: se calculan al volver a guardarlas.")).toBeInTheDocument();
  });

  it("Historias por mes: rótulos sin desfase de zona horaria y meses en cero", async () => {
    mockAdmin(adminDashboard());
    renderWithProviders(<DashboardFeature />);

    const months = within(await screen.findByRole("list", { name: "Últimos 6 meses" })).getAllByRole("listitem");
    expect(months.map((m) => m.getAttribute("aria-label"))).toEqual([
      "mayo de 2026: 4 historias",
      "junio de 2026: 0 historias",
      "julio de 2026: 0 historias",
      "agosto de 2026: 0 historias",
      "septiembre de 2026: 0 historias",
      "octubre de 2026: 7 historias",
    ]);
    expect(within(months[0]).getByText("may")).toBeInTheDocument();
  });

  it("Barras con todo en cero no rompen el ancho", async () => {
    mockAdmin(
      adminDashboard({
        records: { ...adminDashboard().records, perMonth: adminDashboard().records.perMonth.map((m) => ({ ...m, count: 0 })) },
      }),
    );
    renderWithProviders(<DashboardFeature />);
    const list = await screen.findByRole("list", { name: "Últimos 6 meses" });
    list.querySelectorAll<HTMLElement>("[style]").forEach((bar) => expect(bar.style.height).toBe("0%"));
  });

  it("Tratantes con más historias: deshabilitadas marcadas y promedio", async () => {
    mockAdmin(adminDashboard());
    renderWithProviders(<DashboardFeature />);

    expect(await screen.findByText("Dr. Medina (deshabilitada)")).toBeInTheDocument();
    expect(screen.getByText("Promedio: 6,2 de 7 pasos con datos")).toBeInTheDocument();
    expect(screen.getByText("Promedio: sin calcular")).toBeInTheDocument();
  });

  it("Cupos cerca del tope: llenos marcados, total y aviso de que se muestran los 10 más cerca", async () => {
    mockAdmin(adminDashboard());
    renderWithProviders(<DashboardFeature />);

    expect(await screen.findByText("14 tratantes")).toBeInTheDocument();
    const lleno = screen.getByText("Dr. Lleno").closest("li")!;
    expect(within(lleno).getByText("Lleno")).toBeInTheDocument();
    expect(screen.getByText("Dra. Cerca").closest("li")).not.toHaveTextContent("Lleno");
    expect(screen.getByText("Se muestran los 2 más cerca del tope.")).toBeInTheDocument();
  });

  it("El ADMIN no ve métricas de tratante", async () => {
    mockAdmin(adminDashboard());
    renderWithProviders(<DashboardFeature />);
    await screen.findByText("14 tratantes");
    expect(screen.queryByRole("heading", { name: "Para retomar" })).not.toBeInTheDocument();
    expect(screen.queryByText("Cupo")).not.toBeInTheDocument();
  });
});
