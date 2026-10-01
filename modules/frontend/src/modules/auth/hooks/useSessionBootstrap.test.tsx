import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { useSessionStore } from "@/store/useSessionStore";
import { useSessionBootstrap } from "./useSessionBootstrap";

beforeEach(() => {
  useSessionStore.setState({ accessToken: null, user: null, status: "idle" });
});

describe("useSessionBootstrap", () => {
  it("con refresh válido restaura la sesión (autenticado)", async () => {
    server.use(
      http.post("*/auth/refresh", () =>
        HttpResponse.json({ accessToken: "t", user: { id: 1, email: "ana@clinica.test", role: "ADMIN" } }),
      ),
    );

    renderHook(() => useSessionBootstrap());

    await waitFor(() => expect(useSessionStore.getState().status).toBe("authenticated"));
    expect(useSessionStore.getState().user?.role).toBe("ADMIN");
  });

  it("sin refresh válido queda no autenticado y limpia datos residuales", async () => {
    server.use(http.post("*/auth/refresh", () => new HttpResponse(null, { status: 401 })));
    useSessionStore.setState({ accessToken: "viejo", user: { id: 9, email: "x@y.z", role: "USER" }, status: "idle" });

    renderHook(() => useSessionBootstrap());

    await waitFor(() => expect(useSessionStore.getState().status).toBe("unauthenticated"));
    expect(useSessionStore.getState().accessToken).toBeNull();
    expect(useSessionStore.getState().user).toBeNull();
  });
});
