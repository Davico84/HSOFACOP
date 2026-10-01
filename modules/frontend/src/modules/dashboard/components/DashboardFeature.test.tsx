import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/mocks/server";
import { useSessionStore } from "@/store/useSessionStore";
import { DashboardFeature } from "./DashboardFeature";

// Registra toda petición que llegue a MSW durante el test.
const requests: string[] = [];
const onRequest = ({ request }: { request: Request }) => {
  requests.push(request.url);
};

beforeEach(() => {
  requests.length = 0;
  server.events.on("request:start", onRequest);
  useSessionStore.setState({
    accessToken: "tok",
    user: { id: 1, email: "ana@empresa.test", role: "USER", fullName: "Ana Pérez" },
    status: "authenticated",
  });
});

afterEach(() => {
  server.events.removeListener("request:start", onRequest);
});

// Renderiza con RTL y MSW activo: cubre también "Prueba base con MSW" (project-foundation).
describe("app-shell — Dashboard de inicio con datos de ejemplo", () => {
  it("Dashboard tras iniciar sesión: saludo, KPIs y actividad reciente", () => {
    renderWithProviders(<DashboardFeature />);

    expect(screen.getByRole("heading", { level: 1, name: "Hola, Ana Pérez" })).toBeInTheDocument();
    expect(screen.getByText("Usuarios activos")).toBeInTheDocument();
    expect(screen.getByText("Tasa de finalización")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Actividad reciente" })).toBeInTheDocument();
    expect(screen.getByText("Nuevo usuario registrado")).toBeInTheDocument();
  });

  it("Datos marcados como ejemplo: muestra el aviso y no hace peticiones HTTP", async () => {
    renderWithProviders(<DashboardFeature />);

    expect(screen.getByRole("note")).toHaveTextContent(/datos de ejemplo/i);
    // Da una vuelta al event loop por si algún efecto disparara una petición.
    await new Promise((resolve) => queueMicrotask(() => resolve(undefined)));
    expect(requests).toEqual([]);
  });
});
