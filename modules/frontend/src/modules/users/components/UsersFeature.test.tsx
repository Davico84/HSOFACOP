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

const ADMIN: UserSummaryResponse = { id: 1, email: "admin@empresa.test", fullName: "Admin Uno", role: "ADMIN", status: "ACTIVE", recordQuota: null, recordCount: 3 };
const ANA: UserSummaryResponse = { id: 2, email: "ana@empresa.test", fullName: "Ana Pérez", role: "USER", status: "ACTIVE", recordQuota: null, recordCount: 3 };
const LUIS: UserSummaryResponse = { id: 3, email: "luis@empresa.test", fullName: "Luis Gómez", role: "USER", status: "DISABLED", recordQuota: null, recordCount: 0 };

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
  const calls = { patch: 0, quota: [] as { recordQuota: number | null }[] };
  server.use(
    http.get("*/api/users", ({ request }) => {
      const p = Number(new URL(request.url).searchParams.get("page") ?? "0");
      const content = p === 0 ? [...db.values()] : [{ ...ANA, id: 40, email: "otra@empresa.test", fullName: "Otra Persona" }];
      return HttpResponse.json(page(content, p, 2));
    }),
    http.patch("*/api/users/:id/record-quota", async ({ params, request }) => {
      calls.quota.push((await request.json()) as { recordQuota: number | null });
      const user = db.get(Number(params.id))!;
      user.recordQuota = calls.quota.at(-1)!.recordQuota;
      return HttpResponse.json(user);
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

    expect(within(row("Ana Pérez")).getByRole("button", { name: "Deshabilitar la cuenta de Ana Pérez" })).toBeDisabled();
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

describe("users — Cupo de historias por tratante", () => {
  it("la columna Historias muestra el uso; las filas ADMIN dicen 'no aplica' y no tienen 'Cupo'", async () => {
    mockBackend();
    renderWithProviders(<UsersFeature />);

    const ana = await screen.findByRole("row", { name: /Ana Pérez/ });
    expect(screen.getByRole("columnheader", { name: "Historias" })).toBeInTheDocument();
    expect(within(ana).getByText("3 · sin límite")).toBeInTheDocument();
    expect(within(ana).getByRole("button", { name: "Cambiar el cupo de historias de Ana Pérez" })).toBeInTheDocument();
    const admin = row("Admin Uno");
    expect(within(admin).getByText("3 · no aplica")).toBeInTheDocument();
    expect(within(admin).queryByRole("button", { name: /cupo/ })).not.toBeInTheDocument();
  });

  it("asignar un cupo: el diálogo lo envía y la fila muestra '3 de 5'", async () => {
    const calls = mockBackend();
    const user = userEvent.setup();
    renderWithProviders(<UsersFeature />);
    await user.click(await screen.findByRole("button", { name: "Cambiar el cupo de historias de Ana Pérez" }));

    const dialog = await screen.findByRole("dialog", { name: "Cupo de historias de Ana Pérez" });
    const input = within(dialog).getByLabelText("Máximo de historias");
    expect(input).toBeDisabled();
    await user.click(within(dialog).getByRole("checkbox", { name: "Sin límite" }));
    await user.clear(input);
    await user.type(input, "5");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    expect(await within(row("Ana Pérez")).findByText("3 de 5")).toBeInTheDocument();
    expect(calls.quota).toEqual([{ recordQuota: 5 }]);
    expect(toast.success).toHaveBeenCalledWith("Cupo de Ana Pérez: 5 historias");
  });

  it("quitar el límite: 'Sin límite' envía null y la fila muestra '3 · sin límite'", async () => {
    const calls = mockBackend();
    server.use(
      http.get("*/api/users", () => HttpResponse.json(page([{ ...ANA, recordQuota: 5 }]))),
    );
    const user = userEvent.setup();
    renderWithProviders(<UsersFeature />);
    expect(await within(await screen.findByRole("row", { name: /Ana Pérez/ })).findByText("3 de 5")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cambiar el cupo de historias de Ana Pérez" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText("Máximo de historias")).toHaveValue(5);
    await user.click(within(dialog).getByRole("checkbox", { name: "Sin límite" }));
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(calls.quota).toEqual([{ recordQuota: null }]));
    expect(toast.success).toHaveBeenCalledWith("Ana Pérez ya no tiene límite de historias");
  });

  it("cupo por debajo de lo creado: el diálogo avisa y aun así se guarda", async () => {
    const calls = mockBackend();
    const user = userEvent.setup();
    renderWithProviders(<UsersFeature />);
    await user.click(await screen.findByRole("button", { name: "Cambiar el cupo de historias de Ana Pérez" }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("checkbox", { name: "Sin límite" }));
    const input = within(dialog).getByLabelText("Máximo de historias");
    await user.clear(input);
    await user.type(input, "2");

    expect(within(dialog).getByText(/Ya tiene 3 historias: no podrá crear más/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    expect(await within(row("Ana Pérez")).findByText("3 de 2")).toBeInTheDocument();
    expect(calls.quota).toEqual([{ recordQuota: 2 }]);
  });

  it("valor inválido (mayor que 9999 o con decimales): no deja guardar", async () => {
    const calls = mockBackend();
    const user = userEvent.setup();
    renderWithProviders(<UsersFeature />);
    await user.click(await screen.findByRole("button", { name: "Cambiar el cupo de historias de Ana Pérez" }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("checkbox", { name: "Sin límite" }));
    const input = within(dialog).getByLabelText("Máximo de historias");
    await user.clear(input);
    await user.type(input, "10000");
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Ingresa un número entero entre 0 y 9999.");
    expect(within(dialog).getByRole("button", { name: "Guardar" })).toBeDisabled();

    await user.clear(input);
    await user.type(input, "2.5");
    expect(within(dialog).getByRole("button", { name: "Guardar" })).toBeDisabled();
    expect(calls.quota).toEqual([]);
  });
});
