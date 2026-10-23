import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/mocks/server";
import { useSessionStore } from "@/store/useSessionStore";
import { ChangePasswordForm } from "./ChangePasswordForm";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const USER = { id: 2, email: "ana@empresa.test", role: "USER" as const, fullName: "Ana Pérez" };

function mockChange() {
  const bodies: unknown[] = [];
  server.use(
    http.put("*/api/me/password", async ({ request }) => {
      const body = (await request.json()) as { currentPassword: string };
      bodies.push(body);
      if (body.currentPassword !== "password123") {
        return HttpResponse.json(
          { type: "/errors/wrong-current-password", detail: "La contraseña actual no es correcta." },
          { status: 400 },
        );
      }
      return HttpResponse.json({ accessToken: "nuevo-token", user: USER });
    }),
  );
  return bodies;
}

async function fill(user: UserEvent, current: string, next: string, confirm = next) {
  await user.type(screen.getByLabelText("Contraseña actual"), current);
  await user.type(screen.getByLabelText("Nueva contraseña"), next);
  await user.type(screen.getByLabelText("Confirmar la nueva contraseña"), confirm);
  await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
}

beforeEach(() => {
  useSessionStore.setState({ accessToken: "viejo", user: USER, status: "authenticated" });
  toast.success.mockClear();
  toast.error.mockClear();
});

describe("authentication — Cambio de contraseña con la sesión iniciada", () => {
  it("cambio correcto: guarda la sesión nueva y avisa", async () => {
    const bodies = mockChange();
    const user = userEvent.setup();
    renderWithProviders(<ChangePasswordForm />);

    await fill(user, "password123", "nuevaClave456");

    await waitFor(() => expect(useSessionStore.getState().accessToken).toBe("nuevo-token"));
    expect(bodies[0]).toEqual({ currentPassword: "password123", newPassword: "nuevaClave456" });
    expect(toast.success).toHaveBeenCalled();
  });

  it("contraseña actual incorrecta: el error va a su campo, sin toast", async () => {
    mockChange();
    const user = userEvent.setup();
    renderWithProviders(<ChangePasswordForm />);

    await fill(user, "otraClave99", "nuevaClave456");

    expect(await screen.findByText("La contraseña actual no es correcta.")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña actual")).toHaveAttribute("aria-invalid", "true");
    expect(toast.error).not.toHaveBeenCalled();
    expect(useSessionStore.getState().accessToken).toBe("viejo");
  });

  it("nueva igual a la actual, corta o sin coincidir: no envía nada", async () => {
    const bodies = mockChange();
    const user = userEvent.setup();
    renderWithProviders(<ChangePasswordForm />);

    await fill(user, "password123", "password123");
    expect(await screen.findByText("La nueva contraseña debe ser distinta de la actual.")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Nueva contraseña"));
    await user.type(screen.getByLabelText("Nueva contraseña"), "corta");
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
    expect(await screen.findByText("La contraseña debe tener al menos 8 caracteres")).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });
});
