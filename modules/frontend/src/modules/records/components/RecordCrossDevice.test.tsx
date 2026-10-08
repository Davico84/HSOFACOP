import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import type { RecordResponse, UpdateRecordRequest } from "@/modules/core/services/generated/model";
import { useSessionStore } from "@/store/useSessionStore";
import { recordResponse } from "../test/fixtures";
import { renderRecordRoutes } from "../test/renderRecordRoutes";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const NOTICE = "Actualizada con cambios hechos en otro dispositivo";
const REMOTE_BANNER = /La historia cambió en otro dispositivo mientras tenías cambios sin guardar aquí/;

/**
 * Backend en memoria con "otro dispositivo": `remote()` cambia la historia como si se guardara en el
 * celular (sube la versión salvo que se indique lo contrario). Cuenta los GET; `holdGet`/`holdPut`
 * retienen la próxima respuesta; `notFound` responde 404; `unauthorizedOnce` responde 401 una vez.
 */
function mockBackend(initial: Partial<RecordResponse> = {}) {
  let record = recordResponse({ address: "Av. Sol 1", ...initial });
  const state = {
    gets: 0,
    failPut: false,
    notFound: false,
    unauthorizedOnce: false,
    refreshOk: true,
    getGate: null as Promise<void> | null,
    putGate: null as Promise<void> | null,
  };
  const puts: UpdateRecordRequest[] = [];
  const gate = (key: "getGate" | "putGate") => {
    let release!: () => void;
    state[key] = new Promise<void>((resolve) => (release = resolve));
    return () => {
      state[key] = null;
      release();
    };
  };
  server.use(
    http.get("*/api/orthodontic-records/:id", async () => {
      state.gets += 1;
      if (state.unauthorizedOnce) {
        state.unauthorizedOnce = false;
        return HttpResponse.json({ type: "/errors/unauthorized", detail: "Sesión vencida." }, { status: 401 });
      }
      if (state.getGate) await state.getGate;
      if (state.notFound) return HttpResponse.json({ type: "/errors/record-not-found", detail: "No se encontró." }, { status: 404 });
      return HttpResponse.json(record);
    }),
    http.put("*/api/orthodontic-records/:id", async ({ request }) => {
      const body = (await request.json()) as UpdateRecordRequest;
      puts.push(body);
      if (state.putGate) await state.putGate;
      if (state.failPut) return HttpResponse.error();
      if (body.version !== record.version) {
        return HttpResponse.json({ type: "/errors/stale-record", detail: "La historia clínica cambió." }, { status: 409 });
      }
      record = { ...record, ...body, content: body.content ?? record.content, version: record.version + 1 } as RecordResponse;
      return HttpResponse.json(record);
    }),
    http.post("*/auth/refresh", () =>
      state.refreshOk
        ? HttpResponse.json({ accessToken: "nuevo", user: { id: 1, email: "torres@empresa.test", role: "USER", fullName: "Dra. María Torres" } })
        : HttpResponse.json({ type: "/errors/invalid-refresh-token", detail: "Sesión expirada." }, { status: 401 }),
    ),
  );
  return {
    state,
    puts,
    remote: (changes: Partial<RecordResponse>, { bumpVersion = true } = {}) => {
      record = { ...record, ...changes, version: record.version + (bumpVersion ? 1 : 0) };
    },
    holdGet: () => gate("getGate"),
    holdPut: () => gate("putGate"),
  };
}

let visibility: DocumentVisibilityState = "visible";
const setVisibility = (next: DocumentVisibilityState) => {
  visibility = next;
  document.dispatchEvent(new Event("visibilitychange"));
};
/** Volver a la pestaña: vuelve a estar visible (y la consulta se procesa). */
const returnToTab = async () => {
  await act(async () => setVisibility("visible"));
  await act(() => vi.advanceTimersByTimeAsync(0));
};
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const address = () => screen.getByLabelText("Domicilio") as HTMLInputElement;
let user: ReturnType<typeof userEvent.setup>;

async function open(path = "/historias/10?paso=1", initial: Partial<RecordResponse> = {}) {
  const backend = mockBackend(initial);
  const view = renderRecordRoutes(path);
  if (!path.endsWith("nueva")) await screen.findByRole("heading", { level: 2, name: /Paciente y anamnesis/ });
  return { ...backend, ...view };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  visibility = "visible";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
  user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  toast.success.mockClear();
  toast.error.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("orthodontic-records — Actualización al volver a la historia desde otro dispositivo", () => {
  it("volver sin cambios propios: muestra lo guardado en el otro dispositivo, en el mismo paso, con el aviso", async () => {
    const backend = await open();
    const getsAfterOpen = backend.state.gets;
    backend.remote({ address: "Av. Remota 9" });

    await returnToTab();

    await waitFor(() => expect(address().value).toBe("Av. Remota 9"));
    expect(screen.getByRole("status", { name: "" })).toBeDefined();
    expect(screen.getByText(NOTICE)).toBeInTheDocument();
    expect(backend.router.state.location.search).toBe("?paso=1");
    // Una sola consulta: la recarga usa la respuesta de la revisión.
    expect(backend.state.gets).toBe(getsAfterOpen + 1);

    await user.type(address(), "!");
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it("volver con cambios propios que chocan: los conserva, avisa y no autoguarda", async () => {
    const backend = await open();
    await user.clear(address());
    await user.type(address(), "Mi casa");
    backend.remote({ address: "Otra casa" });

    await returnToTab();

    expect(await screen.findByText(REMOTE_BANNER)).toBeInTheDocument();
    expect(address().value).toBe("Mi casa");
    await advance(15_000);
    expect(backend.puts).toHaveLength(0);
  });

  it("cambios propios iguales a los del servidor (respuesta perdida): sin aviso ni pendientes", async () => {
    const backend = await open();
    await user.clear(address());
    await user.type(address(), "Calle 1");
    backend.remote({ address: "Calle 1" });

    await returnToTab();
    await advance(15_000);

    expect(screen.queryByText(REMOTE_BANNER)).not.toBeInTheDocument();
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
    expect(backend.puts).toHaveLength(0);
    expect(screen.queryByText("Cambios sin guardar")).not.toBeInTheDocument();
  });

  it("guardado al ocultar fallido y cambios remotos: conserva lo escrito, avisa y no vuelve a autoguardar", async () => {
    const backend = await open();
    backend.state.failPut = true;
    await user.type(address(), " B");
    await act(async () => setVisibility("hidden"));
    await advance(0);
    expect(backend.puts).toHaveLength(1);
    backend.state.failPut = false;
    backend.remote({ address: "Desde el celular" });

    await returnToTab();

    expect(await screen.findByText(REMOTE_BANNER)).toBeInTheDocument();
    expect(address().value).toBe("Av. Sol 1 B");
    await advance(15_000);
    expect(backend.puts).toHaveLength(1);
  });

  it("autoguardado pendiente durante la revisión: no se envía", async () => {
    const backend = await open();
    const release = backend.holdGet();
    backend.remote({ address: "Desde el celular" });
    await returnToTab();
    // Escribe mientras la consulta espera; el autoguardado queda detrás de la revisión.
    await user.type(address(), " X");
    await advance(4_000);
    release();
    await advance(0);

    expect(await screen.findByText(REMOTE_BANNER)).toBeInTheDocument();
    await advance(15_000);
    expect(backend.puts).toHaveLength(0);
  });

  it("escribir mientras se revisa: no se pierde (aviso en lugar de recargar)", async () => {
    const backend = await open();
    const release = backend.holdGet();
    backend.remote({ address: "Desde el celular" });
    await returnToTab();
    await user.type(address(), " escrito");
    release();
    await advance(0);

    expect(await screen.findByText(REMOTE_BANNER)).toBeInTheDocument();
    expect(address().value).toBe("Av. Sol 1 escrito");
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it("impresión o desbloqueo desde otro dispositivo: el paso 1 lo refleja y lo escrito se conserva", async () => {
    const backend = await open("/historias/10?paso=1", { patientName: "Ana Quispe", patientSex: "FEMALE" });
    await user.type(address(), " B");
    backend.remote({ patientLockedAt: "2026-10-08T15:00:00Z" }, { bumpVersion: false });

    await returnToTab();

    expect(await screen.findByRole("region", { name: "Datos del paciente fijos" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Paciente" })).toHaveAttribute("readonly");
    expect(address().value).toBe("Av. Sol 1 B");
    expect(screen.queryByText(REMOTE_BANNER)).not.toBeInTheDocument();

    backend.remote({ patientLockedAt: undefined, lastUnlock: { byName: "Admin FACOP", at: "2026-10-08T16:00:00Z" } }, { bumpVersion: false });
    await advance(5_000);
    await returnToTab();
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Paciente" })).not.toHaveAttribute("readonly"));
    expect(address().value).toBe("Av. Sol 1 B");
  });

  it("volver sin cambios en el servidor: sin recarga ni aviso", async () => {
    const backend = await open();
    const getsAfterOpen = backend.state.gets;

    await returnToTab();

    await waitFor(() => expect(backend.state.gets).toBe(getsAfterOpen + 1));
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
    expect(screen.queryByText(REMOTE_BANNER)).not.toBeInTheDocument();
  });

  it("guardado propio en curso al volver: no se confunde con otro dispositivo", async () => {
    const backend = await open();
    const release = backend.holdPut();
    await user.type(address(), " B");
    await advance(3_500); // el autoguardado sale y queda en espera
    expect(backend.puts).toHaveLength(1);

    await returnToTab();
    release();
    await advance(0);

    await waitFor(() => expect(screen.queryByText("Cambios sin guardar")).not.toBeInTheDocument());
    expect(screen.queryByText(REMOTE_BANNER)).not.toBeInTheDocument();
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it("una sola consulta: visibilidad, foco y restauración juntos, y alternar ventanas en pocos segundos", async () => {
    const backend = await open();
    const getsAfterOpen = backend.state.gets;

    await returnToTab();
    const pageshow = new Event("pageshow");
    Object.defineProperty(pageshow, "persisted", { value: true });
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(pageshow);
    });
    await advance(2_000);
    await act(async () => window.dispatchEvent(new Event("focus")));
    await advance(0);

    expect(backend.state.gets).toBe(getsAfterOpen + 1);
  });

  it("cerrar un diálogo de la app no provoca consultas", async () => {
    const backend = await open("/historias/10?paso=1", { patientName: "Ana Quispe", patientLockedAt: "2026-10-05T15:00:00Z" });
    const getsAfterOpen = backend.state.gets;

    await user.click(screen.getByRole("button", { name: "Solicitar desbloqueo" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await advance(0);

    expect(backend.state.gets).toBe(getsAfterOpen);
  });

  it("historia que dejó de estar al alcance (404): 'Historia no encontrada' sin otra consulta", async () => {
    const backend = await open();
    const getsAfterOpen = backend.state.gets;
    backend.state.notFound = true;

    await returnToTab();

    expect(await screen.findByRole("heading", { name: "Historia no encontrada" })).toBeInTheDocument();
    expect(backend.state.gets).toBe(getsAfterOpen + 1);
  });

  it("sesión vencida al volver: si se renueva, repite la consulta y actualiza", async () => {
    const backend = await open();
    backend.state.unauthorizedOnce = true;
    backend.remote({ address: "Tras renovar" });

    await returnToTab();

    await waitFor(() => expect(address().value).toBe("Tras renovar"));
    expect(useSessionStore.getState().accessToken).toBe("nuevo");
  });

  it("sesión vencida al volver: si no se renueva, se cierra la sesión", async () => {
    const backend = await open();
    backend.state.unauthorizedOnce = true;
    backend.state.refreshOk = false;

    await returnToTab();

    await waitFor(() => expect(useSessionStore.getState().status).toBe("unauthenticated"));
  });

  it("volver desde la vista de impresión muestra lo último guardado", async () => {
    const backend = await open();
    await act(() => backend.router.navigate("/historias/10/imprimir"));
    await screen.findAllByRole("article");
    backend.remote({ address: "Guardado en el celular" });

    await act(() => backend.router.navigate("/historias/10?paso=1"));

    await waitFor(() => expect(address().value).toBe("Guardado en el celular"));
  });

  it("historia todavía sin crear: no consulta nada", async () => {
    const backend = await open("/historias/nueva");
    await screen.findByRole("textbox", { name: "Nro. de historia" });
    const getsAfterOpen = backend.state.gets;

    await returnToTab();
    await advance(0);

    expect(backend.state.gets).toBe(getsAfterOpen);
  });
});
