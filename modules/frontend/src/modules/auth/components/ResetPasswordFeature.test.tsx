import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { TooltipProvider } from "@/modules/core/ui/tooltip";
import { ResetPasswordFeature } from "./ResetPasswordFeature";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const INVALID = "El enlace no es válido o venció. Pide uno nuevo al administrador.";

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: "/restablecer", element: <ResetPasswordFeature /> },
      { path: "/ingresar", element: <p>Pantalla de login</p> },
    ],
    { initialEntries: [path] },
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <TooltipProvider delayDuration={0}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </TooltipProvider>,
  );
  return router;
}

/** Restablecimiento en memoria: solo el token "valido" sirve. */
function mockReset() {
  const bodies: unknown[] = [];
  server.use(
    http.post("*/auth/password-reset", async ({ request }) => {
      const body = (await request.json()) as { token: string };
      bodies.push(body);
      if (body.token !== "valido") {
        return HttpResponse.json({ type: "/errors/invalid-password-reset", detail: INVALID }, { status: 400 });
      }
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return bodies;
}

async function fill(user: UserEvent, password: string, confirm = password) {
  await user.type(screen.getByLabelText("Nueva contraseña"), password);
  await user.type(screen.getByLabelText("Confirmar contraseña"), confirm);
  await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));
}

beforeEach(() => {
  toast.success.mockClear();
});

describe("authentication — Restablecimiento de contraseña con un enlace", () => {
  it("enlace válido: envía el token del fragmento, lo quita de la barra y va al login con aviso", async () => {
    const bodies = mockReset();
    const user = userEvent.setup();
    const router = renderAt("/restablecer#t=valido");

    await waitFor(() => expect(router.state.location.hash).toBe(""));
    await fill(user, "nuevaClave456");

    expect(await screen.findByText("Pantalla de login")).toBeInTheDocument();
    expect(bodies[0]).toEqual({ token: "valido", newPassword: "nuevaClave456" });
    expect(toast.success).toHaveBeenCalledWith("Contraseña actualizada. Inicia sesión.");
  });

  it("enlace no válido: muestra cómo pedir uno nuevo", async () => {
    mockReset();
    const user = userEvent.setup();
    renderAt("/restablecer#t=usado");

    await fill(user, "nuevaClave456");

    expect(await screen.findByText(INVALID)).toBeInTheDocument();
    expect(screen.queryByLabelText("Nueva contraseña")).not.toBeInTheDocument();
  });

  it("sin token en el enlace: el aviso de enlace no válido, sin formulario", () => {
    renderAt("/restablecer");

    expect(screen.getByText(INVALID)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar contraseña" })).not.toBeInTheDocument();
  });

  it("contraseña corta o sin coincidir: error junto al campo y no envía", async () => {
    const bodies = mockReset();
    const user = userEvent.setup();
    renderAt("/restablecer#t=valido");

    await fill(user, "corta", "otra");

    expect(await screen.findByText("La contraseña debe tener al menos 8 caracteres")).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });
});
