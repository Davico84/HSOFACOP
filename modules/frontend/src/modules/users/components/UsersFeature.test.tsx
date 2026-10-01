import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils";
import type { UserSummaryResponse } from "@/modules/core/services/generated/model";
import { UsersFeature } from "./UsersFeature";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const ADMIN: UserSummaryResponse = { id: 1, email: "admin@empresa.test", fullName: "Admin Uno", role: "ADMIN", status: "ACTIVE" };
const ANA: UserSummaryResponse = { id: 2, email: "ana@empresa.test", fullName: "Ana Pérez", role: "USER", status: "ACTIVE" };
const LUIS: UserSummaryResponse = { id: 3, email: "luis@empresa.test", fullName: "Luis Gómez", role: "USER", status: "DISABLED" };

function page(content: UserSummaryResponse[], pageNumber = 0, totalPages = 1) {
  return {
    content,
    page: pageNumber,
    size: 20,
    totalElements: totalPages * 20,
    totalPages,
    last: pageNumber >= totalPages - 1,
  };
}

/** Backend en memoria: listado paginado (2 páginas) y PATCH que cambia el estado. */
function mockBackend() {
  const db = new Map<number, UserSummaryResponse>([ADMIN, ANA, LUIS].map((u) => [u.id, { ...u }]));
  const calls = { patch: 0 };
  server.use(
    http.get("*/api/users", ({ request }) => {
      const p = Number(new URL(request.url).searchParams.get("page") ?? "0");
      const content = p === 0 ? [...db.values()] : [{ ...ANA, id: 40, email: "otra@empresa.test", fullName: "Otra Persona" }];
      return HttpResponse.json(page(content, p, 2));
    }),
    http.patch("*/api/users/:id/status", async ({ params, request }) => {
      calls.patch += 1;
      const { status } = (await request.json()) as { status: "ACTIVE" | "DISABLED" };
      const user = db.get(Number(params.id))!;
      user.status = status;
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

describe("users — Pantalla de usuarios para administradores", () => {
  it("Listado en pantalla: nombre, correo, rol y estado; filas ADMIN sin acción", async () => {
    mockBackend();
    renderWithProviders(<UsersFeature />);

    const ana = await screen.findByRole("row", { name: /Ana Pérez/ });
    expect(within(ana).getByText("ana@empresa.test")).toBeInTheDocument();
    expect(within(ana).getByText("Usuario")).toBeInTheDocument();
    expect(within(ana).getByText("Activa")).toBeInTheDocument();
    expect(within(ana).getByRole("button", { name: "Deshabilitar la cuenta de Ana Pérez" })).toBeInTheDocument();
    expect(within(row("Luis Gómez")).getByRole("button", { name: "Activar la cuenta de Luis Gómez" })).toBeInTheDocument();
    expect(within(row("Admin Uno")).queryByRole("button")).not.toBeInTheDocument();
  });

  it("Cambio de página: muestra la página pedida y 'Siguiente' se deshabilita en la última", async () => {
    mockBackend();
    const user = userEvent.setup();
    renderWithProviders(<UsersFeature />);
    await screen.findByRole("row", { name: /Ana Pérez/ });
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByRole("row", { name: /Otra Persona/ })).toBeInTheDocument();
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });

  it("Cambio de página: la tabla anterior sigue visible mientras carga la nueva", async () => {
    mockBackend();
    server.use(
      http.get("*/api/users", async ({ request }) => {
        const p = Number(new URL(request.url).searchParams.get("page") ?? "0");
        if (p === 1) await delay(200);
        return HttpResponse.json(page(p === 0 ? [ANA] : [LUIS], p, 2));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<UsersFeature />);
    await screen.findByRole("row", { name: /Ana Pérez/ });

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(screen.getByRole("row", { name: /Ana Pérez/ })).toBeInTheDocument(); // placeholder
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled(); // sin doble clic mientras carga
    expect(await screen.findByRole("row", { name: /Luis Gómez/ })).toBeInTheDocument();
  });

  it("Deshabilitar con confirmación: al confirmar la fila pasa a deshabilitada con 'Activar'", async () => {
    const calls = mockBackend();
    const user = userEvent.setup();
    renderWithProviders(<UsersFeature />);

    await user.click(await screen.findByRole("button", { name: "Deshabilitar la cuenta de Ana Pérez" }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText(/¿Deshabilitar la cuenta de/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Deshabilitar" }));

    await waitFor(() => expect(within(row("Ana Pérez")).getByText("Deshabilitada")).toBeInTheDocument());
    expect(within(row("Ana Pérez")).getByRole("button", { name: "Activar la cuenta de Ana Pérez" })).toBeInTheDocument();
    expect(calls.patch).toBe(1);
    expect(toast.success).toHaveBeenCalledWith("Cuenta de Ana Pérez deshabilitada");
  });

  it("Deshabilitar con confirmación: al cancelar no se envía ninguna petición", async () => {
    const calls = mockBackend();
    const user = userEvent.setup();
    renderWithProviders(<UsersFeature />);

    await user.click(await screen.findByRole("button", { name: "Deshabilitar la cuenta de Ana Pérez" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(calls.patch).toBe(0);
    expect(within(row("Ana Pérez")).getByText("Activa")).toBeInTheDocument();
  });

  it("Deshabilitar con confirmación: mientras la petición está en curso la acción no puede repetirse", async () => {
    mockBackend();
    server.use(
      http.patch("*/api/users/:id/status", async () => {
        await delay(200);
        return HttpResponse.json({ ...ANA, status: "DISABLED" });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<UsersFeature />);

    await user.click(await screen.findByRole("button", { name: "Deshabilitar la cuenta de Ana Pérez" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Deshabilitar" }));

    expect(within(row("Ana Pérez")).getByRole("button")).toBeDisabled();
  });

  it("Error al cambiar el estado: muestra el mensaje y recarga el listado", async () => {
    mockBackend();
    let lists = 0;
    server.use(
      http.get("*/api/users", () => {
        lists += 1;
        return HttpResponse.json(page([ANA]));
      }),
      http.patch("*/api/users/:id/status", () =>
        HttpResponse.json(
          { type: "/errors/account-status-not-changeable", title: "Conflict", status: 409,
            detail: "Solo se puede cambiar el estado de cuentas con rol USER.", timestamp: "2026-10-01T12:00:00Z" },
          { status: 409, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<UsersFeature />);

    await user.click(await screen.findByRole("button", { name: "Deshabilitar la cuenta de Ana Pérez" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Deshabilitar" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Solo se puede cambiar el estado de cuentas con rol USER."));
    await waitFor(() => expect(lists).toBeGreaterThanOrEqual(2));
  });

  it("Página vacía: ofrece volver a la página anterior, sin error", async () => {
    server.use(
      http.get("*/api/users", ({ request }) => {
        const p = Number(new URL(request.url).searchParams.get("page") ?? "0");
        return HttpResponse.json(p === 0 ? page([ANA], 0, 2) : page([], 1, 1));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<UsersFeature />);
    await screen.findByRole("row", { name: /Ana Pérez/ });

    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.click(await screen.findByRole("button", { name: "Volver a la página anterior" }));

    expect(await screen.findByRole("row", { name: /Ana Pérez/ })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
