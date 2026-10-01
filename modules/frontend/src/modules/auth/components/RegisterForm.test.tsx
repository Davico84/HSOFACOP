import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Toaster } from "sonner";
import type { UserEvent } from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/mocks/server";
import { useSessionStore } from "@/store/useSessionStore";
import { RegisterForm } from "./RegisterForm";

beforeEach(() => {
  useSessionStore.setState({ accessToken: null, user: null, status: "idle" });
});

async function fillRegister(
  user: UserEvent,
  opts: { email?: string; password?: string; confirmPassword?: string } = {},
) {
  const password = opts.password ?? "password123";
  await user.type(screen.getByLabelText(/nombre completo/i), "Ana Pérez");
  await user.type(screen.getByLabelText(/correo/i), opts.email ?? "nuevo@clinica.test");
  await user.type(screen.getByLabelText(/^contraseña$/i), password);
  await user.type(screen.getByLabelText(/confirmar contraseña/i), opts.confirmPassword ?? password);
}

describe("RegisterForm", () => {
  it("valida campos obligatorios y no envía la petición", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(await screen.findByText("Ingresa tu nombre completo")).toBeInTheDocument();
    expect(useSessionStore.getState().status).toBe("idle");
  });


  it("rechaza contraseña de menos de 8 caracteres sin enviar la petición", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await fillRegister(user, { password: "1234" });
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      await screen.findByText("La contraseña debe tener al menos 8 caracteres"),
    ).toBeInTheDocument();
    expect(useSessionStore.getState().status).toBe("idle");
  });

  it("rechaza cuando la confirmación de contraseña no coincide", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await fillRegister(user, { password: "password123", confirmPassword: "password124" });
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(await screen.findByText("Las contraseñas no coinciden")).toBeInTheDocument();
    expect(useSessionStore.getState().status).toBe("idle");
  });

  it("con datos válidos crea la cuenta e inicia sesión", async () => {
    server.use(
      http.post("*/auth/register", () =>
        HttpResponse.json(
          { accessToken: "tok", user: { id: 2, email: "nuevo@clinica.test", role: "USER", fullName: "Ana Pérez" } },
          { status: 201 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await fillRegister(user);
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => expect(useSessionStore.getState().status).toBe("authenticated"));
    expect(useSessionStore.getState().user?.fullName).toBe("Ana Pérez");
  });

  it("con correo ya registrado muestra el error y no inicia sesión", async () => {
    server.use(
      http.post("*/auth/register", () =>
        HttpResponse.json(
          { status: 409, detail: "El correo ya está registrado: nuevo@clinica.test" },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <RegisterForm />
        <Toaster />
      </>,
    );

    await fillRegister(user);
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(await screen.findByText(/ya está registrado/i)).toBeInTheDocument();
    expect(useSessionStore.getState().status).toBe("idle");
  });
});
