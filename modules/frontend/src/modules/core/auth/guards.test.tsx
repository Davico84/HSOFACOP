import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { RequireAuth } from "./RequireAuth";
import { RequireGuest } from "./RequireGuest";
import { useSessionStore } from "@/store/useSessionStore";

function renderAt(initialPath: string) {
  const router = createMemoryRouter(
    [
      { element: <RequireGuest />, children: [{ path: "/auth/login", element: <div>Página de login</div> }] },
      { element: <RequireAuth />, children: [{ path: "/", element: <div>Panel privado</div> }] },
      { element: <RequireAuth roles={["ADMIN"]} />, children: [{ path: "/admin", element: <div>Solo admin</div> }] },
    ],
    { initialEntries: [initialPath] },
  );
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  useSessionStore.setState({ accessToken: null, user: null, status: "unauthenticated" });
});

describe("RouteGuards", () => {
  it("ruta privada sin sesión redirige a login", async () => {
    renderAt("/");
    expect(await screen.findByText("Página de login")).toBeInTheDocument();
  });

  it("con sesión, una ruta de /auth redirige al panel", async () => {
    useSessionStore.setState({
      accessToken: "t",
      user: { id: 1, email: "a@b.c", role: "USER" },
      status: "authenticated",
    });
    renderAt("/auth/login");
    expect(await screen.findByText("Panel privado")).toBeInTheDocument();
  });

  it("rol sin permiso muestra acceso denegado", async () => {
    useSessionStore.setState({
      accessToken: "t",
      user: { id: 1, email: "a@b.c", role: "USER" },
      status: "authenticated",
    });
    renderAt("/admin");
    expect(await screen.findByText("Acceso denegado")).toBeInTheDocument();
  });
});
