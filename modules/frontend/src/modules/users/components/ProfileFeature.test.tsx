import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/mocks/server";
import type { ProfileResponse } from "@/modules/core/services/generated/model";
import { ProfileFeature } from "./ProfileFeature";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const ANA: ProfileResponse = { id: 2, email: "ana@empresa.test", fullName: "Ana Pérez", role: "USER" };

function mockProfile() {
  const saved: unknown[] = [];
  let current: ProfileResponse = { ...ANA };
  server.use(
    http.get("*/api/me/profile", () => HttpResponse.json(current)),
    http.put("*/api/me/profile", async ({ request }) => {
      const body = (await request.json()) as Partial<ProfileResponse>;
      saved.push(body);
      current = { ...current, ...body };
      return HttpResponse.json(current);
    }),
  );
  return saved;
}

beforeEach(() => {
  toast.success.mockClear();
});

describe("users — Pantalla \"Mis datos\"", () => {
  it("muestra nombre, correo y rol de solo lectura", async () => {
    mockProfile();
    renderWithProviders(<ProfileFeature />);

    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("ana@empresa.test")).toBeInTheDocument();
    expect(screen.getByText("Alumno")).toBeInTheDocument();
  });

  it("completar los datos después del registro: guarda y avisa", async () => {
    const saved = mockProfile();
    const user = userEvent.setup();
    renderWithProviders(<ProfileFeature />);

    await user.type(await screen.findByLabelText("Celular"), "987654321");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Datos guardados"));
    expect(saved[0]).toEqual({ phone: "987654321", documentType: null, documentNumber: null, copNumber: null });
  });

  it("error junto al campo: DNI de 7 dígitos, sin enviar", async () => {
    const saved = mockProfile();
    const user = userEvent.setup();
    renderWithProviders(<ProfileFeature />);

    await user.click(await screen.findByRole("combobox", { name: "Tipo de documento" }));
    await user.click(await screen.findByRole("option", { name: "DNI" }));
    await user.type(screen.getByLabelText("Número de documento"), "7412589");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("El DNI debe tener 8 dígitos.")).toBeInTheDocument();
    expect(saved).toHaveLength(0);
  });
});
