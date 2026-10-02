import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  it("vista preliminar: cada hoja con logos y cabecera; el diálogo se abre solo al pulsar Imprimir", async () => {
    serve(recordResponse());
    renderRecordRoutes("/historias/10/imprimir");

    const sheets = await screen.findAllByRole("article");
    expect(sheets.length).toBeGreaterThanOrEqual(7);
    for (const sheet of sheets) {
      expect(within(sheet).getByText(/HISTORIA CLÍNICA ORTODONCIA Nro\./)).toHaveTextContent("AEO-001");
      expect(within(sheet).getByRole("img", { name: /AEO/ })).toBeInTheDocument();
      expect(within(sheet).getByRole("img", { name: /FACOP/ })).toBeInTheDocument();
    }
    await vi.advanceTimersByTimeAsync(2000);
    expect(print).not.toHaveBeenCalled();

    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole("button", { name: "Imprimir" }));
    expect(print).toHaveBeenCalledTimes(1);
  });

  it("opciones con la elegida marcada: ☒ Mesofacial ☐ Dolicofacial ☐ Braquifacial", async () => {
    serve(withContent({ facial: { facialType: "MESOFACIAL" } }));
    renderRecordRoutes("/historias/10/imprimir");

    const line = (await screen.findByText("1. TIPO FACIAL:")).parentElement!;
    expect(line.textContent?.replace(/\(.*?\)\s*/g, "")).toMatch(/☒\s*Mesofacial\s*☐\s*Dolicofacial\s*☐\s*Braquifacial/);
  });

  it("pregunta con \":\": opciones en el renglón siguiente, juntas si caben (tercios) y el texto debajo", async () => {
    serve(withContent({ facial: { facialThirds: "ABSENT", facialThirdsNotes: "Tercio inferior aumentado", restSymmetry: "PRESENT" } }));
    renderRecordRoutes("/historias/10/imprimir");

    const block = (await screen.findByText("3. PROPORCIÓN DE LOS TERCIOS FACIALES:")).parentElement!;
    const rows = Array.from(block.querySelectorAll("p")).map((p) => p.textContent?.replace(/\(.*?\)\s*/g, ""));
    expect(rows).toEqual(["3. PROPORCIÓN DE LOS TERCIOS FACIALES:", "☐ Presenta☒ No presenta"]);
    expect(screen.getByText("Tercio inferior aumentado")).toBeInTheDocument();
  });

  it("opciones largas que no caben en un renglón: una por renglón (relación de labios)", async () => {
    serve(withContent({ facial: { lipAnteroposteriorRelation: "SAME_LINE" } }));
    renderRecordRoutes("/historias/10/imprimir");

    const block = (await screen.findByText("5. RELACIÓN ANTEROPOSTERIOR DE LABIOS:")).parentElement!;
    expect(block.querySelectorAll("p")).toHaveLength(4);
  });

  it("una historia a medio llenar no imprime 'null' ni 'undefined'", async () => {
    serve(recordResponse());
    const { container } = renderRecordRoutes("/historias/10/imprimir");
    await screen.findAllByRole("article");

    expect(container.textContent).not.toMatch(/null|undefined/);
  });

  it("anamnesis: los textos vacíos se imprimen como 'No refiere'; los escritos, tal cual", async () => {
    serve(withContent({ anamnesis: { chiefComplaint: "Dientes salidos" } }));
    renderRecordRoutes("/historias/10/imprimir");
    await screen.findAllByRole("article");

    expect(screen.getByText("Dientes salidos")).toBeInTheDocument();
    expect(screen.getAllByText("No refiere")).toHaveLength(6);
  });

  it("los textos escritos salen sin líneas; conservan su línea los datos del paciente, la fecha y las firmas", async () => {
    serve(withContent({ diagnosis: { generalDiagnosis: "Clase II esquelética", problemList: ["Mordida profunda"], treatmentGoals: [] } },
      { address: "Av. Ejército 512" }));
    const { container } = renderRecordRoutes("/historias/10/imprimir");
    await screen.findAllByRole("article");

    for (const text of ["Clase II esquelética", "1. Mordida profunda"]) {
      expect(screen.getByText(text).className).not.toMatch(/border-b/);
    }
    expect(screen.getByText("Av. Ejército 512").className).toMatch(/border-b/);
    expect(screen.getByText("Av. Ejército 512").className).not.toMatch(/text-center/);
    const lined = Array.from(container.querySelectorAll("article .border-b"));
    for (const line of lined) {
      expect(line.parentElement?.textContent).toMatch(
        /^(FECHA:|Firma|PACIENTE|Paciente|Edad|Sexo|Domicilio|Fecha de inicio de tratamiento:|Documento|Lugar y fecha de nacimiento del paciente|Celular)/,
      );
    }
  });

  it("la última hoja es 'Notas de evolución' en blanco para llenar a mano", async () => {
    serve(recordResponse());
    renderRecordRoutes("/historias/10/imprimir");

    const sheets = await screen.findAllByRole("article");
    const last = sheets[sheets.length - 1];
    const table = within(last).getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Notas de evolución" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Tratante encargado:" })).toBeInTheDocument();
    expect(within(table).getAllByRole("columnheader").slice(2).map((h) => h.textContent))
      .toEqual(["Fecha", "Trabajo realizado", "Firma de docente"]);
    const bodyRows = within(table).getAllByRole("row").slice(3);
    expect(bodyRows).toHaveLength(37);
    expect(bodyRows.every((r) => r.textContent === "")).toBe(true);
  });

  it("hoja del análisis transversal tras el oclusal, con las diferencias calculadas", async () => {
    serve(withContent(
      { models: { transversal: { intermolarUpper: 50.1, intermolarLower: 45.8, walaToEv: { firstMolar: 2.6 }, interpretation: "Compresión leve" } } },
      { patientSex: "FEMALE", ageYears: 13 },
    ));
    renderRecordRoutes("/historias/10/imprimir");
    const sheets = await screen.findAllByRole("article");

    const titles = sheets.map((sheet) => within(sheet).queryAllByRole("heading", { level: 2 })[0]?.textContent ?? "");
    expect(titles.indexOf("Análisis de modelos")).toBe(titles.indexOf("Análisis oclusal") + 1);
    const models = sheets[titles.indexOf("Análisis de modelos")];
    expect(within(models).getByText("Análisis Transversal de los Modelos")).toBeInTheDocument();
    expect(within(models).getByText("(promedio 52,4 mm · −2,3)")).toBeInTheDocument();
    expect(within(models).getByText("(promedio 46,1 mm · −0,3)")).toBeInTheDocument();
    expect(within(models).getByText("+0,6")).toBeInTheDocument();
    expect(within(models).getByText("Femenino")).toBeInTheDocument();
    expect(within(models).getByText("Compresión leve")).toBeInTheDocument();
  });

  it("la menstruación no se imprime si el paciente no es de sexo femenino", async () => {
    serve(recordResponse({ patientSex: "MALE" }));
    renderRecordRoutes("/historias/10/imprimir");
    await screen.findAllByRole("article");

    expect(screen.queryByText(/1ª menstruación/)).not.toBeInTheDocument();
  });

  it("datos cortos del paciente centrados sobre su línea (edad, fechas, documento, celular)", async () => {
    serve(recordResponse({ ageYears: 13, treatmentStartDate: "2026-05-19", birthPlace: "Arequipa", birthDate: "2012-05-20",
      documentType: "DNI", documentNumber: "74125896", phone: "987 654 321" }));
    renderRecordRoutes("/historias/10/imprimir");
    await screen.findAllByRole("article");

    const first = screen.getAllByRole("article")[0];
    for (const text of ["13 años", "19/05/2026", "Arequipa, 20/05/2012", "DNI 74125896", "987 654 321"]) {
      expect(within(first).getByText(text).className).toMatch(/text-center/);
    }
  });

  it("las etiquetas en línea terminan en ':' para separarlas de su contenido", async () => {
    serve(recordResponse({ address: "Av. Ejército 512" }));
    renderRecordRoutes("/historias/10/imprimir");
    await screen.findAllByRole("article");

    for (const label of ["PACIENTE:", "Domicilio:", "Documento:", "Celular:", "Lugar y fecha de nacimiento del paciente:"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getAllByText("Nombre:").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText("Firma:").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("Mordida profunda de")).toBeInTheDocument();
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
    expect(within(screen.getAllByRole("article")[0]).getByText("13 años")).toBeInTheDocument();
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
