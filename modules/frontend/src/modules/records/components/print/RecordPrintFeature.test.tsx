import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import type { RecordResponse } from "@/modules/core/services/generated/model";
import { recordResponse } from "../../test/fixtures";
import { renderRecordRoutes } from "../../test/renderRecordRoutes";

function serve(record: RecordResponse) {
  server.use(
    http.get("*/api/orthodontic-records/:id", ({ params }) =>
      Number(params.id) === record.id
        ? HttpResponse.json(record)
        : HttpResponse.json({ type: "/errors/record-not-found", detail: "No se encontró la historia clínica." }, { status: 404 }),
    ),
  );
}

function withContent(content: Partial<RecordResponse["content"]>, rest: Partial<RecordResponse> = {}): RecordResponse {
  const base = recordResponse(rest);
  return { ...base, content: { ...base.content, ...content } };
}

let print: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  print = vi.spyOn(window, "print").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.useRealTimers();
  print.mockRestore();
});

describe("orthodontic-records — Impresión con presentación del PDF", () => {
  it("cada hoja lleva los logos y la cabecera con el número, y se abre el diálogo de impresión", async () => {
    serve(recordResponse());
    renderRecordRoutes("/historias/10/imprimir");

    const sheets = await screen.findAllByRole("article");
    expect(sheets.length).toBeGreaterThanOrEqual(7);
    for (const sheet of sheets) {
      expect(within(sheet).getByText(/HISTORIA CLÍNICA ORTODONCIA Nro\./)).toHaveTextContent("AEO-001");
      expect(within(sheet).getByRole("img", { name: /AEO/ })).toBeInTheDocument();
      expect(within(sheet).getByRole("img", { name: /FACOP/ })).toBeInTheDocument();
    }
    await vi.advanceTimersByTimeAsync(500);
    expect(print).toHaveBeenCalledTimes(1);
  });

  it("opciones con la elegida marcada: ☒ Mesofacial ☐ Dolicofacial ☐ Braquifacial", async () => {
    serve(withContent({ facial: { facialType: "MESOFACIAL" } }));
    renderRecordRoutes("/historias/10/imprimir");

    const line = (await screen.findByText("1. TIPO FACIAL:")).parentElement!;
    expect(line.textContent?.replace(/\(.*?\)\s*/g, "")).toMatch(/☒\s*Mesofacial\s*☐\s*Dolicofacial\s*☐\s*Braquifacial/);
  });

  it("una historia a medio llenar no imprime 'null' ni 'undefined'", async () => {
    serve(recordResponse());
    const { container } = renderRecordRoutes("/historias/10/imprimir");
    await screen.findAllByRole("article");

    expect(container.textContent).not.toMatch(/null|undefined/);
  });

  it("la menstruación no se imprime si el paciente no es de sexo femenino", async () => {
    serve(recordResponse({ patientSex: "MALE" }));
    renderRecordRoutes("/historias/10/imprimir");
    await screen.findAllByRole("article");

    expect(screen.queryByText(/1ª menstruación/)).not.toBeInTheDocument();
  });

  it("documento, edad, piezas FDI y lista numerada", async () => {
    serve(withContent(
      {
        functional: { suckingHabitTypes: ["NONE"], bruxism: "WITH_WEAR", bruxismTeeth: [13, 26, 55] },
        diagnosis: { problemList: ["Mordida profunda", "Overjet aumentado"], treatmentGoals: [] },
      },
      { documentType: "FOREIGNER_CARD", documentNumber: "001234567", ageYears: 13 },
    ));
    renderRecordRoutes("/historias/10/imprimir");
    await screen.findAllByRole("article");

    expect(screen.getByText("CE 001234567")).toBeInTheDocument();
    expect(screen.getByText("13 años")).toBeInTheDocument();
    expect(screen.getByText("13, 26, 55")).toBeInTheDocument();
    expect(screen.getByText("1. Mordida profunda")).toBeInTheDocument();
    expect(screen.getByText("2. Overjet aumentado")).toBeInTheDocument();
  });

  it("firma del apoderado si es menor; fecha en blanco para llenarla a mano", async () => {
    serve(withContent({ signatures: { guardianName: "Rosa Mamani", guardianRelationship: "Madre" } }, { ageYears: 13 }));
    renderRecordRoutes("/historias/10/imprimir");
    await screen.findAllByRole("article");

    expect(screen.getByText("FIRMA DEL APODERADO:")).toBeInTheDocument();
    expect(screen.queryByText("FIRMA DEL PACIENTE:")).not.toBeInTheDocument();
    expect(screen.getByText("Rosa Mamani")).toBeInTheDocument();
    expect(screen.getByText("FECHA:").nextElementSibling).toHaveTextContent("");
  });

  it("sin acceso a la historia: 'Historia no encontrada' y no se imprime", async () => {
    serve(recordResponse());
    renderRecordRoutes("/historias/99/imprimir");

    expect(await screen.findByRole("heading", { name: "Historia no encontrada" })).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(500);
    expect(print).not.toHaveBeenCalled();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });
});
