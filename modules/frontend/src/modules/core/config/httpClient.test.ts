import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { useSessionStore } from "@/store/useSessionStore";
import { axiosInstance } from "./httpClient";

const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: toastError } }));

beforeEach(() => {
  toastError.mockClear();
  useSessionStore.setState({ accessToken: "expirado", user: null, status: "authenticated" });
});

describe("httpClient — interceptor de refresh", () => {
  it("ante 401 renueva el token y reintenta la petición de forma transparente", async () => {
    let protectedCalls = 0;
    server.use(
      http.get("*/protected", () => {
        protectedCalls += 1;
        return protectedCalls === 1
          ? new HttpResponse(null, { status: 401 })
          : HttpResponse.json({ ok: true });
      }),
      http.post("*/auth/refresh", () =>
        HttpResponse.json({ accessToken: "nuevo", user: { id: 1, email: "a@b.c", role: "USER" } }),
      ),
    );

    const { data } = await axiosInstance.get("/protected");

    expect(data).toEqual({ ok: true });
    expect(protectedCalls).toBe(2); // 401 + reintento
    expect(useSessionStore.getState().accessToken).toBe("nuevo");
  });

  it("si el refresh falla, cierra la sesión y propaga el error", async () => {
    server.use(
      http.get("*/protected", () => new HttpResponse(null, { status: 401 })),
      http.post("*/auth/refresh", () => new HttpResponse(null, { status: 401 })),
    );

    await expect(axiosInstance.get("/protected")).rejects.toBeTruthy();
    expect(useSessionStore.getState().accessToken).toBeNull();
    expect(useSessionStore.getState().status).toBe("unauthenticated");
  });
  it("si el refresh falla por un 401 normal, cierra la sesión sin aviso", async () => {
    server.use(
      http.get("*/protected", () => new HttpResponse(null, { status: 401 })),
      http.post("*/auth/refresh", () => new HttpResponse(null, { status: 401 })),
    );

    await expect(axiosInstance.get("/protected")).rejects.toBeTruthy();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("Refresco de una cuenta deshabilitada: cierra la sesión y avisa UNA vez aunque fallen varias peticiones", async () => {
    let refreshCalls = 0;
    server.use(
      http.get("*/protected", () => new HttpResponse(null, { status: 401 })),
      http.post("*/auth/refresh", () => {
        refreshCalls += 1;
        return HttpResponse.json(
          {
            type: "/errors/account-disabled",
            title: "Forbidden",
            status: 403,
            detail: "Tu cuenta está deshabilitada. Contacta con el administrador.",
            timestamp: "2026-10-01T12:00:00Z",
          },
          { status: 403, headers: { "Content-Type": "application/problem+json" } },
        );
      }),
    );

    const results = await Promise.allSettled([axiosInstance.get("/protected"), axiosInstance.get("/protected")]);

    expect(results.every((r) => r.status === "rejected")).toBe(true);
    expect(refreshCalls).toBe(1); // single-flight: sin bucle ni refresh repetido
    expect(useSessionStore.getState().status).toBe("unauthenticated");
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith("Tu cuenta está deshabilitada. Contacta con el administrador.");
  });
});
