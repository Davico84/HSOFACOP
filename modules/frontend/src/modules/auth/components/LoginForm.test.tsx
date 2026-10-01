import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Toaster } from "sonner";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/mocks/server";
import { useSessionStore } from "@/store/useSessionStore";
import { LoginForm } from "./LoginForm";

beforeEach(() => {
  useSessionStore.setState({ accessToken: null, user: null, status: "idle" });
});

describe("LoginForm", () => {
  it("valida campos vacíos y no envía la petición", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(await screen.findByText("El correo es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("La contraseña es obligatoria")).toBeInTheDocument();
    expect(useSessionStore.getState().status).toBe("idle");
  });

  it("con credenciales válidas establece la sesión", async () => {
    server.use(
      http.post("*/auth/login", () =>
        HttpResponse.json({
          accessToken: "tok",
          user: { id: 1, email: "ana@clinica.test", role: "USER" },
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/correo/i), "ana@clinica.test");
    await user.type(screen.getByLabelText(/^contraseña$/i), "password123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => expect(useSessionStore.getState().status).toBe("authenticated"));
    expect(useSessionStore.getState().user?.email).toBe("ana@clinica.test");
  });

  it("con credenciales inválidas muestra el mensaje genérico y no inicia sesión", async () => {
    server.use(
      http.post("*/auth/login", () =>
        HttpResponse.json(
          {
            type: "/errors/invalid-credentials",
            title: "Unauthorized",
            status: 401,
            detail: "Correo electrónico o contraseña incorrectos",
          },
          { status: 401 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <LoginForm />
        <Toaster />
      </>,
    );

    await user.type(screen.getByLabelText(/correo/i), "ana@clinica.test");
    await user.type(screen.getByLabelText(/^contraseña$/i), "malaclave");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(
      await screen.findByText("Correo electrónico o contraseña incorrectos"),
    ).toBeInTheDocument();
    expect(useSessionStore.getState().status).toBe("idle");
  });
});
