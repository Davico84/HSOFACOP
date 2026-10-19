import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/mocks/server";
import { useSessionStore } from "@/store/useSessionStore";
import { RegisterForm } from "./RegisterForm";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const AUTH = { accessToken: "tok", user: { id: 5, email: "ana@clinica.test", role: "USER", fullName: "Ana Pérez" } };

/** Registro en memoria: guarda el cuerpo y responde según el código. */
function mockRegister() {
  const bodies: Record<string, unknown>[] = [];
  server.use(
    http.post("*/auth/register", async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      bodies.push(body);
      if (body.cohortCode === "ZZZZ-ZZZZ") {
        return HttpResponse.json(
          { type: "/errors/invalid-cohort-code", detail: "El código de turma no es válido." },
          { status: 400 },
        );
      }
      if (body.cohortCode === "CERR-ADA2") {
        return HttpResponse.json(
          { type: "/errors/cohort-registration-closed", detail: "La turma ya no acepta inscripciones." },
          { status: 400 },
        );
      }
      return HttpResponse.json(AUTH, { status: 201 });
    }),
  );
  return bodies;
}

async function fillRequired(user: UserEvent) {
  await user.type(screen.getByLabelText(/nombre completo/i), "Ana Pérez");
  await user.type(screen.getByLabelText(/correo/i), "ana@clinica.test");
  await user.type(screen.getByLabelText(/^contraseña$/i), "password123");
  await user.type(screen.getByLabelText(/confirmar contraseña/i), "password123");
}

beforeEach(() => {
  useSessionStore.setState({ accessToken: null, user: null, status: "idle" });
  toast.error.mockClear();
});

describe("authentication + cohorts — registro con código de turma y datos del alumno", () => {
  it("sin código ni datos: envía todo lo opcional como null", async () => {
    const bodies = mockRegister();
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => expect(useSessionStore.getState().status).toBe("authenticated"));
    expect(bodies[0]).toMatchObject({ cohortCode: null, phone: null, documentType: null, documentNumber: null, copNumber: null });
  });

  it("con código y datos: los envía", async () => {
    const bodies = mockRegister();
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await fillRequired(user);
    await user.type(screen.getByLabelText(/código de turma/i), "k7qm-4txr");
    await user.type(screen.getByLabelText("Celular"), "987654321");
    await user.click(screen.getByRole("combobox", { name: "Tipo de documento" }));
    await user.click(await screen.findByRole("option", { name: "DNI" }));
    await user.type(screen.getByLabelText("Número de documento"), "74125896");
    await user.type(screen.getByLabelText(/COP/), "12345");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({
      cohortCode: "k7qm-4txr", phone: "987654321", documentType: "DNI", documentNumber: "74125896", copNumber: "12345",
    });
  });

  it("código inexistente: el error va junto al campo, sin toast ni sesión", async () => {
    mockRegister();
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await fillRequired(user);
    await user.type(screen.getByLabelText(/código de turma/i), "ZZZZ-ZZZZ");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(await screen.findByText("El código de turma no es válido.")).toBeInTheDocument();
    expect(screen.getByLabelText(/código de turma/i)).toHaveAttribute("aria-invalid", "true");
    expect(toast.error).not.toHaveBeenCalled();
    expect(useSessionStore.getState().status).toBe("idle");
  });

  it("turma cerrada: el aviso va junto al campo", async () => {
    mockRegister();
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await fillRequired(user);
    await user.type(screen.getByLabelText(/código de turma/i), "CERR-ADA2");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(await screen.findByText("La turma ya no acepta inscripciones.")).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("dato opcional inválido: error junto al campo y no envía nada", async () => {
    const bodies = mockRegister();
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await fillRequired(user);
    await user.type(screen.getByLabelText("Celular"), "98765432");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(await screen.findByText("El celular debe tener 9 dígitos y empezar con 9.")).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });
});
