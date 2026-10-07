import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import type { RecordResponse, UpdateRecordRequest } from "@/modules/core/services/generated/model";
import { recordResponse } from "../test/fixtures";
import { renderRecordRoutes } from "../test/renderRecordRoutes";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

/**
 * Backend en memoria de una historia con control de versión. `hold()` deja el próximo PUT en
 * espera hasta llamar a la función que devuelve; `fail` responde 500.
 */
function mockRecord(initial: Partial<RecordResponse> = {}) {
  let record = recordResponse(initial);
  const state = { fail: false, gate: null as Promise<void> | null };
  const calls = { put: [] as UpdateRecordRequest[], post: 0 };
  server.use(
    http.get("*/api/orthodontic-records/:id", () => HttpResponse.json(record)),
    http.put("*/api/orthodontic-records/:id", async ({ request }) => {
      const body = (await request.json()) as UpdateRecordRequest;
      calls.put.push(body);
      if (state.gate) await state.gate;
      if (state.fail) return HttpResponse.json({ detail: "Ocurrió un error inesperado." }, { status: 500 });
      if (body.version !== record.version) {
        return HttpResponse.json({ type: "/errors/stale-record", detail: "La historia clínica cambió." }, { status: 409 });
      }
      // Como el servidor real: recorta espacios.
      const patientAddress = typeof body.address === "string" ? body.address.trim() : body.address;
      record = {
        ...record,
        ...body,
        address: patientAddress,
        content: body.content ?? record.content,
        lastStep: body.lastStep ?? record.lastStep,
        version: record.version + 1,
      } as RecordResponse;
      return HttpResponse.json(record);
    }),
    http.post("*/api/orthodontic-records", () => {
      calls.post += 1;
      return HttpResponse.json(recordResponse(), { status: 201 });
    }),
  );
  return {
    calls,
    state,
    bump: () => (record = { ...record, version: record.version + 1 }),
    hold: () => {
      let release!: () => void;
      state.gate = new Promise<void>((resolve) => (release = resolve));
      return () => {
        state.gate = null;
        release();
      };
    },
  };
}

const stepHeading = (title: RegExp) => screen.findByRole("heading", { level: 2, name: title });
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  toast.success.mockClear();
  toast.error.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

async function openStep1(initial: Partial<RecordResponse> = {}) {
  const backend = mockRecord(initial);
  const view = renderRecordRoutes("/historias/10?paso=1");
  await stepHeading(/Paciente y anamnesis/);
  return { ...backend, ...view };
}

describe("orthodontic-records — Autoguardado del paso en curso", () => {
  it("guarda unos segundos después de dejar de escribir, sin notificaciones", async () => {
    const { calls } = await openStep1();
    await user.type(screen.getByLabelText("Domicilio"), "Av. Sol 123");
    expect(screen.getByText("Cambios sin guardar")).toBeInTheDocument();

    await advance(2_000);
    expect(calls.put).toHaveLength(0);
    await advance(1_500);

    await waitFor(() => expect(calls.put).toHaveLength(1));
    expect(calls.put[0]).toMatchObject({ address: "Av. Sol 123", lastStep: 1, version: 0 });
    expect(await screen.findByText("Guardado")).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("pausas cortas seguidas: como máximo un autoguardado cada 10 segundos, sin perder cambios", async () => {
    const { calls } = await openStep1();
    await user.type(screen.getByLabelText("Domicilio"), "Av. Sol");
    await advance(3_500);
    await waitFor(() => expect(calls.put).toHaveLength(1));

    await user.type(screen.getByLabelText("Domicilio"), " 123");
    await advance(4_000);
    expect(calls.put).toHaveLength(1);

    await advance(7_000);
    await waitFor(() => expect(calls.put).toHaveLength(2));
    expect(calls.put[1]).toMatchObject({ address: "Av. Sol 123", version: 1 });
  });

  it("guarda de inmediato al ocultarse la pestaña", async () => {
    const { calls } = await openStep1();
    await user.type(screen.getByLabelText("Domicilio"), "Av. Sol 123");

    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    visibility.mockRestore();

    await waitFor(() => expect(calls.put).toHaveLength(1));
  });

  it("paso con errores: no guarda, marca el campo y lo indica", async () => {
    const { calls } = await openStep1();
    await user.click(screen.getByLabelText("Domicilio"));
    await user.paste("x".repeat(201));

    await advance(3_500);

    expect(await screen.findByText("Sin guardar: corrige los campos marcados")).toBeInTheDocument();
    expect(calls.put).toHaveLength(0);
  });

  it("lo escrito durante el guardado se conserva, sigue pendiente y se guarda después", async () => {
    const backend = await openStep1();
    const release = backend.hold();
    const address = screen.getByLabelText("Domicilio");
    await user.type(address, "Av. Sol");
    await advance(3_500);
    await waitFor(() => expect(backend.calls.put).toHaveLength(1));
    expect(screen.getByText("Guardando…")).toBeInTheDocument();

    await user.type(address, " 123");
    release();

    await waitFor(() => expect(screen.getByText("Cambios sin guardar")).toBeInTheDocument());
    expect(address).toHaveValue("Av. Sol 123");

    await advance(10_500);
    await waitFor(() => expect(backend.calls.put).toHaveLength(2));
    expect(backend.calls.put[1]).toMatchObject({ address: "Av. Sol 123", version: 1 });
  });

  it("un valor que el servidor ajusta no queda pendiente ni se guarda sin fin", async () => {
    const { calls } = await openStep1();
    await user.type(screen.getByLabelText("Domicilio"), "Av. Sol 123   ");
    await advance(3_500);
    await waitFor(() => expect(calls.put).toHaveLength(1));

    expect(await screen.findByText("Guardado")).toBeInTheDocument();
    expect(screen.getByLabelText("Domicilio")).toHaveValue("Av. Sol 123");
    await advance(30_000);
    expect(calls.put).toHaveLength(1);
  });

  it("fallo de red: avisa, conserva lo escrito y 'Reintentar' vuelve a guardar", async () => {
    const backend = await openStep1();
    backend.state.fail = true;
    await user.type(screen.getByLabelText("Domicilio"), "Av. Sol 123");
    await advance(3_500);

    expect(await screen.findByText("No se pudo guardar")).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Domicilio")).toHaveValue("Av. Sol 123");

    backend.state.fail = false;
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Guardado")).toBeInTheDocument();
    expect(backend.calls.put).toHaveLength(2);
  });

  it("al recuperar la conexión reintenta", async () => {
    const backend = await openStep1();
    backend.state.fail = true;
    await user.type(screen.getByLabelText("Domicilio"), "Av. Sol 123");
    await advance(3_500);
    await screen.findByText("No se pudo guardar");

    backend.state.fail = false;
    act(() => window.dispatchEvent(new Event("online")));
    expect(await screen.findByText("Guardado")).toBeInTheDocument();
  });

  it("guardada desde otro dispositivo (409): muestra el aviso y no vuelve a autoguardar", async () => {
    const backend = await openStep1();
    backend.bump();
    await user.type(screen.getByLabelText("Domicilio"), "Av. Sol");
    await advance(3_500);

    expect(await screen.findByRole("button", { name: /Recargar historia/ })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Domicilio"), " 123");
    await advance(30_000);
    expect(backend.calls.put).toHaveLength(1);
  });

  it("sin cambios no envía nada", async () => {
    const { calls } = await openStep1();
    await advance(30_000);
    expect(calls.put).toHaveLength(0);
  });

  it("una historia nueva no se crea ni se guarda sola", async () => {
    const { calls } = mockRecord();
    renderRecordRoutes("/historias/nueva");
    await user.type(screen.getByRole("textbox", { name: "Paciente" }), "Ana Quispe");
    await advance(30_000);
    expect(calls.post).toBe(0);
    expect(calls.put).toHaveLength(0);
  });
});

describe("orthodontic-records — Retomar en el último paso trabajado", () => {
  it("sin paso en la dirección abre el último paso guardado", async () => {
    mockRecord({ lastStep: 6 });
    const { router } = renderRecordRoutes("/historias/10");
    expect(await stepHeading(/Análisis radiográfico/)).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.search).toBe("?paso=6"));
  });

  it("un paso explícito en la dirección tiene prioridad", async () => {
    mockRecord({ lastStep: 6 });
    renderRecordRoutes("/historias/10?paso=3");
    expect(await stepHeading(/Análisis funcional/)).toBeInTheDocument();
  });

  it("una historia sin paso guardado abre el paso 1", async () => {
    mockRecord({ lastStep: undefined });
    const { router } = renderRecordRoutes("/historias/10");
    expect(await stepHeading(/Paciente y anamnesis/)).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.search).toBe("?paso=1"));
  });

  it("al cambiar de paso con cambios guarda el destino como último paso; 'Guardar' el actual", async () => {
    const { calls } = await openStep1();
    await user.type(screen.getByLabelText("Domicilio"), "Av. Sol");
    await user.click(screen.getByRole("button", { name: /Siguiente/ }));
    await stepHeading(/Análisis facial/);
    expect(calls.put[0]).toMatchObject({ lastStep: 2 });

    await user.type(screen.getByLabelText("Observaciones (tercios)"), "Tercio inferior aumentado");
    await user.click(screen.getByRole("button", { name: /Guardar/ }));
    await waitFor(() => expect(calls.put).toHaveLength(2));
    expect(calls.put[1]).toMatchObject({ lastStep: 2 });
    expect(toast.success).toHaveBeenCalledWith("Historia AOC-0001 guardada");
  });

  it("recorrer pasos sin cambios no cambia el último paso", async () => {
    const { calls } = await openStep1();
    await user.click(screen.getByRole("button", { name: /Siguiente/ }));
    await stepHeading(/Análisis facial/);
    await user.click(screen.getByRole("button", { name: /Siguiente/ }));
    await stepHeading(/Análisis funcional/);
    expect(calls.put).toHaveLength(0);
  });
});
