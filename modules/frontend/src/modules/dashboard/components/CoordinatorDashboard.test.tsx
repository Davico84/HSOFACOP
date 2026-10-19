import { beforeEach, describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/mocks/server";
import { useSessionStore } from "@/store/useSessionStore";
import type { CoordinatorDashboardResponse } from "@/modules/core/services/generated/model";
import { DashboardFeature } from "./DashboardFeature";

const DATA: CoordinatorDashboardResponse = {
  cohorts: [
    {
      id: 1,
      name: "Turma 1",
      students: 2,
      records: 3,
      complete: 1,
      inProgress: 1,
      notComputed: 1,
      studentsWithoutRecords: 1,
      studentList: [
        { id: 5, fullName: "Ana Alumna", records: 3, complete: 1 },
        { id: 6, fullName: "Bea Alumna", records: 0, complete: 0 },
      ],
    },
    {
      id: 2,
      name: "Turma 2",
      students: 0,
      records: 0,
      complete: 0,
      inProgress: 0,
      notComputed: 0,
      studentsWithoutRecords: 0,
      studentList: [],
    },
  ],
};

beforeEach(() => {
  useSessionStore.setState({
    accessToken: "tok",
    status: "authenticated",
    user: { id: 7, email: "coord@empresa.test", role: "COORDINATOR", fullName: "Dra. Coordinación" },
  });
});

describe("cohorts — Avance de las turmas en Inicio", () => {
  it("Avance de una turma: resumen y alumnos con sus historias y completas", async () => {
    server.use(http.get("*/api/dashboard/coordinator", () => HttpResponse.json(DATA)));
    renderWithProviders(<DashboardFeature />);

    const turma = await screen.findByRole("region", { name: "Turma 1" });
    expect(within(turma).getByText("2 alumnos")).toBeInTheDocument();
    expect(within(turma).getByText("Completas", { selector: "dt" }).nextSibling).toHaveTextContent("1");
    expect(within(turma).getByText("Sin historias", { selector: "dt" }).nextSibling).toHaveTextContent("1");
    expect(within(turma).getByText("3 historias · 1 completas")).toBeInTheDocument();
    expect(within(turma).getByText(/1 historia sin calcular/)).toBeInTheDocument();
    const students = within(turma).getByRole("list", { name: "Alumnos de Turma 1" });
    expect(within(students).getByText("Bea Alumna")).toBeInTheDocument();
  });

  it("Turma sin alumnos: 0 alumnos con un estado vacío", async () => {
    server.use(http.get("*/api/dashboard/coordinator", () => HttpResponse.json(DATA)));
    renderWithProviders(<DashboardFeature />);

    const turma = await screen.findByRole("region", { name: "Turma 2" });
    expect(within(turma).getByText("0 alumnos")).toBeInTheDocument();
    expect(within(turma).getByText("Esta turma aún no tiene alumnos.")).toBeInTheDocument();
  });
});
