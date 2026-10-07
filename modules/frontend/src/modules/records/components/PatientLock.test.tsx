import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import type { RecordResponse, RecordSummaryResponse, UpdateRecordRequest } from "@/modules/core/services/generated/model";
import { page, recordResponse, summary } from "../test/fixtures";
import { renderRecordRoutes } from "../test/renderRecordRoutes";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const LOCKED: Partial<RecordResponse> = {
  patientName: "Ana Quispe",
  documentType: "DNI",
  documentNumber: "74125896",
  birthDate: "2012-05-20",
  patientSex: "FEMALE",
  birthPlace: "Lima",
  patientLockedAt: "2026-10-05T15:00:00Z",
};

/** Historia en memoria con los endpoints de bloqueo; registra lo que se envía. */
function mockRecord(initial: Partial<RecordResponse> = {}) {
  let record = recordResponse(initial);
  const calls = { put: [] as UpdateRecordRequest[], requests: [] as string[], unlocks: 0, discards: 0 };
  server.use(
    http.get("*/api/orthodontic-records/:id", () => HttpResponse.json(record)),
    http.put("*/api/orthodontic-records/:id", async ({ request }) => {
      const body = (await request.json()) as UpdateRecordRequest;
      calls.put.push(body);
      record = { ...record, ...body, content: body.content ?? record.content, version: record.version + 1 } as RecordResponse;
      return HttpResponse.json(record);
    }),
    http.post("*/api/orthodontic-records/:id/unlock-request", async ({ request }) => {
      const { reason } = (await request.json()) as { reason: string };
      calls.requests.push(reason);
      record = { ...record, unlockRequest: { requestedAt: "2026-10-06T14:00:00Z", reason } };
      return new HttpResponse(null, { status: 204 });
    }),
    http.delete("*/api/orthodontic-records/:id/patient-lock", () => {
      calls.unlocks += 1;
      record = {
        ...record,
        patientLockedAt: undefined,
        unlockRequest: undefined,
        lastUnlock: { byName: "Admin FACOP", at: "2026-10-06T15:00:00Z" },
      };
      return new HttpResponse(null, { status: 204 });
    }),
    http.delete("*/api/orthodontic-records/:id/unlock-request", () => {
      calls.discards += 1;
      record = { ...record, unlockRequest: undefined };
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return calls;
}

const stepHeading = (title: RegExp) => screen.findByRole("heading", { level: 2, name: title });

beforeEach(() => {
  toast.success.mockClear();
  toast.error.mockClear();
});

describe("orthodontic-records — Datos del paciente fijos tras imprimir", () => {
  it("con los datos fijos, el paso 1 los muestra de solo lectura y avisa desde cuándo", async () => {
    mockRecord(LOCKED);
    renderRecordRoutes("/historias/10?paso=1");
    await stepHeading(/Paciente y anamnesis/);

    const notice = screen.getByRole("region", { name: "Datos del paciente fijos" });
    expect(within(notice).getByText(/Datos del paciente fijos desde el 05\/10\/2026/)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Paciente" })).toHaveAttribute("readonly");
    for (const label of ["Número", "Lugar de nacimiento", "Fecha de nacimiento"]) {
      expect(screen.getByLabelText(label)).toHaveAttribute("readonly");
    }
    expect(screen.getByRole("radio", { name: "Masculino" })).toBeDisabled();
    expect(screen.getByLabelText("Domicilio")).not.toHaveAttribute("readonly");
  });

  it("sin imprimir, los datos del paciente se editan normalmente", async () => {
    mockRecord({ patientName: "Ana Quispe" });
    renderRecordRoutes("/historias/10?paso=1");
    await stepHeading(/Paciente y anamnesis/);

    expect(screen.queryByRole("region", { name: "Datos del paciente fijos" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Paciente" })).not.toHaveAttribute("readonly");
  });

  it("el tratante solicita el desbloqueo con un motivo (obligatorio) y queda pendiente", async () => {
    const calls = mockRecord(LOCKED);
    renderRecordRoutes("/historias/10?paso=1");
    await stepHeading(/Paciente y anamnesis/);

    await userEvent.click(screen.getByRole("button", { name: "Solicitar desbloqueo" }));
    const dialog = await screen.findByRole("dialog", { name: "Solicitar desbloqueo" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Enviar solicitud" }));
    expect(await within(dialog).findByText("Indica el motivo.")).toBeInTheDocument();
    expect(calls.requests).toEqual([]);

    await userEvent.type(within(dialog).getByLabelText("Motivo"), "Error en el número de DNI");
    await userEvent.click(within(dialog).getByRole("button", { name: "Enviar solicitud" }));

    await waitFor(() => expect(calls.requests).toEqual(["Error en el número de DNI"]));
    expect(await screen.findByText(/Desbloqueo solicitado el 06\/10\/2026/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Solicitar desbloqueo" })).not.toBeInTheDocument();
  });

  it("el ADMIN ve el motivo, desbloquea con confirmación y luego se muestra el último desbloqueo", async () => {
    const calls = mockRecord({ ...LOCKED, unlockRequest: { requestedAt: "2026-10-06T14:00:00Z", reason: "Error en el DNI" } });
    renderRecordRoutes("/historias/10?paso=1", "ADMIN");
    await stepHeading(/Paciente y anamnesis/);

    expect(screen.getByText(/«Error en el DNI»/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Desbloquear datos del paciente" }));
    await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Desbloquear" }));

    await waitFor(() => expect(calls.unlocks).toBe(1));
    expect(await screen.findByText(/desbloqueados por Admin FACOP el 06\/10\/2026/)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Paciente" })).not.toHaveAttribute("readonly");
  });

  it("el ADMIN descarta la solicitud y los datos siguen fijos", async () => {
    const calls = mockRecord({ ...LOCKED, unlockRequest: { requestedAt: "2026-10-06T14:00:00Z", reason: "Error" } });
    renderRecordRoutes("/historias/10?paso=1", "ADMIN");
    await stepHeading(/Paciente y anamnesis/);

    await userEvent.click(screen.getByRole("button", { name: "Descartar solicitud" }));

    await waitFor(() => expect(calls.discards).toBe(1));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Descartar solicitud" })).not.toBeInTheDocument());
    expect(screen.getByRole("region", { name: "Datos del paciente fijos" })).toBeInTheDocument();
  });

  it("el 409 de datos fijos se avisa sin 'Reintentar'", async () => {
    mockRecord({ patientName: "Ana Quispe" });
    server.use(
      http.put("*/api/orthodontic-records/:id", () =>
        HttpResponse.json(
          { type: "/errors/patient-locked", detail: "Los datos del paciente quedaron fijos al imprimir la historia. Solicita el desbloqueo para corregirlos." },
          { status: 409 },
        ),
      ),
    );
    renderRecordRoutes("/historias/10?paso=1");
    await stepHeading(/Paciente y anamnesis/);
    await userEvent.type(screen.getByLabelText("Domicilio"), "x");
    await userEvent.click(screen.getByRole("button", { name: /Guardar/ }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Los datos del paciente quedaron fijos al imprimir la historia. Solicita el desbloqueo para corregirlos.",
      ),
    );
  });
});

describe("orthodontic-records — Autoguardado con datos fijos", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("el cuerpo del autoguardado conserva los datos fijos y el guardado funciona", async () => {
    const calls = mockRecord(LOCKED);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderRecordRoutes("/historias/10?paso=1");
    await stepHeading(/Paciente y anamnesis/);

    await user.type(screen.getByLabelText("Domicilio"), "Av. Sol 123");
    await act(() => vi.advanceTimersByTimeAsync(3_500));

    await waitFor(() => expect(calls.put).toHaveLength(1));
    expect(calls.put[0]).toMatchObject({
      patientName: "Ana Quispe",
      documentType: "DNI",
      documentNumber: "74125896",
      birthDate: "2012-05-20",
      patientSex: "FEMALE",
      birthPlace: "Lima",
      address: "Av. Sol 123",
    });
  });
});

describe("orthodontic-records — Candado en el listado", () => {
  it("las historias con los datos fijos muestran el candado; las demás no", async () => {
    const rows: RecordSummaryResponse[] = [
      summary({ id: 10, recordNumber: "AOC-0001", patientLocked: true }),
      summary({ id: 11, recordNumber: "AOC-0002", patientName: "Rosa Díaz" }),
    ];
    server.use(http.get("*/api/orthodontic-records", () => HttpResponse.json(page(rows))));
    renderRecordRoutes("/historias");

    const locked = await screen.findByRole("row", { name: /AOC-0001/ });
    expect(within(locked).getByRole("img", { name: "Datos del paciente fijos" })).toBeInTheDocument();
    expect(within(screen.getByRole("row", { name: /AOC-0002/ })).queryByRole("img", { name: "Datos del paciente fijos" })).toBeNull();
  });
});
