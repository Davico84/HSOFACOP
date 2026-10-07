import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import type { RecordResponse } from "@/modules/core/services/generated/model";
import { recordResponse } from "../../test/fixtures";
import { renderRecordRoutes } from "../../test/renderRecordRoutes";

/** Historia y registro de la impresión; `printed` cuenta los registros y guarda el cuerpo enviado. */
function serve(record: RecordResponse, printResponse: { status?: number; clinicalFilledSteps?: number } = {}) {
  const printed: { calls: number; body: unknown } = { calls: 0, body: null };
  server.use(
    http.get("*/api/orthodontic-records/:id", ({ params }) =>
      Number(params.id) === record.id
        ? HttpResponse.json(record)
        : HttpResponse.json({ type: "/errors/record-not-found", detail: "No se encontró la historia clínica." }, { status: 404 }),
    ),
    http.post("*/api/orthodontic-records/:id/print", async ({ request }) => {
      printed.calls += 1;
      printed.body = await request.json().catch(() => null);
      if (printResponse.status && printResponse.status >= 400) {
        return HttpResponse.json({ detail: "Ocurrió un error inesperado." }, { status: printResponse.status });
      }
      return HttpResponse.json({
        record: { ...record, patientLockedAt: "2026-10-05T15:00:00Z" },
        printedOn: "2026-10-05",
        clinicalFilledSteps: printResponse.clinicalFilledSteps ?? 1,
      });
    }),
  );
  return printed;
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
      expect(within(sheet).getByText(/HISTORIA CLÍNICA ORTODONCIA Nro\./)).toHaveTextContent("AOC-0001");
      expect(within(sheet).getByRole("img", { name: /AEO/ })).toBeInTheDocument();
      expect(within(sheet).getByRole("img", { name: /FACOP/ })).toBeInTheDocument();
    }
    await vi.advanceTimersByTimeAsync(2000);
    expect(print).not.toHaveBeenCalled();

    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole("button", { name: "Imprimir" }));
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
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
        /^(FECHA:|Firma|PACIENTE|Paciente|Edad|Sexo|Domicilio|Fecha de inicio de tratamiento:|Documento|Lugar y fecha de nacimiento del paciente|Celular|Nombre:|Fecha:)/,
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
      { models: { transversal: { intermolarUpper: 50.1, intermolarLower: 45.8, walaToEv: { firstMolar: 2.6 }, interpretation: "Compresión leve" }, moyers: {}, nance: {}, bolton: {} } },
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

  it("hoja de Moyers tras la del transversal, con requerido y diferencias calculados y la predisposición escrita", async () => {
    serve(withContent(
      { models: { transversal: {}, moyers: {
        analysisDate: "2026-09-01",
        lowerIncisors: { tooth42: 6.0, tooth41: 5.5, tooth31: 5.4, tooth32: 6.1 },
        availableSpace: { mandibleRight: 21.0, mandibleLeft: 22.6, maxillaRight: 23.5, maxillaLeft: 22.6 },
        crowdingNegative: "Mandíbula derecho",
        interpretation: "Discrepancia negativa leve",
      }, nance: {}, bolton: {} } },
      { ageYears: 13 },
    ));
    renderRecordRoutes("/historias/10/imprimir");
    const sheets = await screen.findAllByRole("article");

    const titles = sheets.map((sheet) => within(sheet).queryAllByRole("heading", { level: 2 })[0]?.textContent ?? "");
    expect(titles.indexOf("Ficha para el análisis de Moyers")).toBe(titles.indexOf("Análisis de modelos") + 1);
    const moyers = sheets[titles.indexOf("Ficha para el análisis de Moyers")];
    expect(within(moyers).getByText("01/09/2026")).toBeInTheDocument();
    expect(within(moyers).getByLabelText("Pieza 42")).toHaveTextContent("6,0");
    expect(within(moyers).getByLabelText("Pieza 32")).toHaveTextContent("6,1");
    expect(within(moyers).getByLabelText("Suma de anteriores")).toHaveTextContent("23,0");
    const rows = within(moyers).getAllByRole("row").map((r) => r.textContent);
    expect(rows).toContain("Espacio requerido (Moyers 75 %)22,222,222,622,6");
    expect(rows).toContain("Diferencia−1,2+0,4+0,90,0");
    expect(rows).toContain("Positivo");
    expect(rows).toContain("NegativoMandíbula derecho");
    expect(within(moyers).getByText("Discrepancia negativa leve")).toBeInTheDocument();
  });

  it("hoja de Nance tras la de Moyers, con ST y discrepancia calculados, el dibujo y la conclusión escrita", async () => {
    serve(withContent(
      { models: { transversal: {}, moyers: {}, nance: {
        analysisDate: "2026-09-01",
        availableUpper: 70.5,
        upperWidths: { tooth15: 7.0, tooth14: 7.1, tooth13: 7.8, tooth12: 6.7, tooth11: 8.6, tooth21: 8.5, tooth22: 6.6, tooth23: 7.7, tooth24: 7.0, tooth25: 6.9 },
        lowerWidths: { tooth31: 5.4 },
        conclusionUpper: "Falta de espacio leve",
        interpretation: "Discrepancia negativa en el maxilar",
      }, bolton: {} } },
      { ageYears: 13 },
    ));
    renderRecordRoutes("/historias/10/imprimir");
    const sheets = await screen.findAllByRole("article");

    const titles = sheets.map((sheet) => within(sheet).queryAllByRole("heading", { level: 2 })[0]?.textContent ?? "");
    const index = titles.indexOf("Análisis de Nance · discrepancia óseo dentaria");
    expect(index).toBe(titles.indexOf("Ficha para el análisis de Moyers") + 1);
    const nance = sheets[index];
    expect(within(nance).getByRole("img", { name: /Arcada superior/ })).toBeInTheDocument();
    expect(within(nance).getByLabelText("Pieza 11")).toHaveTextContent("8,6");
    expect(within(nance).getByLabelText("Pieza 31")).toHaveTextContent("5,4");
    expect(within(nance).getByLabelText("Total superior")).toHaveTextContent("73,9 mm");
    expect(within(nance).getByLabelText("Total inferior")).toHaveTextContent("");
    const rows = within(nance).getAllByRole("row").map((r) => r.textContent);
    expect(rows).toContain("Superior70,5 mm73,9 mm−3,4 mmFalta de espacio leve");
    expect(rows).toContain("Inferior");
    expect(within(nance).getByText("Discrepancia negativa en el maxilar")).toBeInTheDocument();
  });

  it("hoja de Bolton tras la de Nance, en español, con las relaciones calculadas", async () => {
    const boltonModels = {
      transversal: {},
      moyers: {},
      nance: {
        upperWidths: { tooth15: 7.0, tooth14: 7.1, tooth13: 7.8, tooth12: 6.7, tooth11: 8.6, tooth21: 8.5, tooth22: 6.6, tooth23: 7.7, tooth24: 7.0, tooth25: 6.9 },
        lowerWidths: { tooth45: 7.2, tooth44: 7.0, tooth43: 6.9, tooth42: 6.0, tooth41: 5.5, tooth31: 5.4, tooth32: 6.1, tooth33: 6.8, tooth34: 7.1, tooth35: 7.3 },
      },
      bolton: { analysisDate: "2026-09-01", firstMolars: { tooth16: 10.2, tooth26: 10.1, tooth46: 11.0, tooth36: 11.2 }, incisors: { tooth12: 6.7, tooth11: 8.6, tooth21: 8.5, tooth22: 6.6, tooth42: 6.0, tooth41: 5.5, tooth31: 5.4, tooth32: 6.1 }, interpretation: "Exceso mandibular leve" },
    };
    serve(withContent({ models: boltonModels }, { ageYears: 13 }));
    renderRecordRoutes("/historias/10/imprimir");
    const sheets = await screen.findAllByRole("article");

    const titles = sheets.map((sheet) => within(sheet).queryAllByRole("heading", { level: 2 })[0]?.textContent ?? "");
    const index = titles.indexOf("Análisis de Bolton");
    expect(index).toBe(titles.indexOf("Análisis de Nance · discrepancia óseo dentaria") + 1);
    const bolton = sheets[index];
    expect(within(bolton).getByLabelText("Pieza 16")).toHaveTextContent("10,2");
    expect(within(bolton).getByLabelText("Pieza 11")).toHaveTextContent("8,6");
    const total = within(bolton).getByRole("region", { name: "Relación total" });
    expect(within(total).getByLabelText("Relación total (%)")).toHaveTextContent("92,9 %");
    expect(within(total).getAllByRole("row").map((r) => r.textContent)).toContain("87,5 mm86,0 mm+1,5 mm");
    expect(within(bolton).getByText("Exceso mandibular leve")).toBeInTheDocument();
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

describe("orthodontic-records — Impresión registrada en el servidor", () => {
  it("'Imprimir' registra la impresión antes de abrir el diálogo y habilita las hojas solo mientras imprime", async () => {
    const printed = serve(recordResponse());
    let readyDuringPrint = false;
    print.mockImplementation(() => {
      readyDuringPrint = document.querySelector("[data-print-ready]") !== null;
    });
    renderRecordRoutes("/historias/10/imprimir");
    await screen.findAllByRole("article");
    expect(document.querySelector("[data-print-ready]")).toBeNull();

    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole("button", { name: "Imprimir" }));

    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
    expect(printed.calls).toBe(1);
    expect(printed.body).toEqual({ filledSteps: [1] });
    expect(readyDuringPrint).toBe(true);
    // Al volver del diálogo las hojas vuelven a estar ocultas para imprimir.
    await waitFor(() => expect(document.querySelector("[data-print-ready]")).toBeNull());
  });

  it("si el registro falla no abre el diálogo", async () => {
    const printed = serve(recordResponse(), { status: 500 });
    renderRecordRoutes("/historias/10/imprimir");
    await screen.findAllByRole("article");

    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole("button", { name: "Imprimir" }));

    await waitFor(() => expect(printed.calls).toBe(1));
    await vi.advanceTimersByTimeAsync(500);
    expect(print).not.toHaveBeenCalled();
    expect(document.querySelector("[data-print-ready]")).toBeNull();
  });

  it("imprimir por otro medio saca el aviso: las hojas están ocultas al imprimir por defecto", async () => {
    serve(recordResponse());
    renderRecordRoutes("/historias/10/imprimir");
    await screen.findAllByRole("article");

    expect(screen.getByText("Usa el botón Imprimir de la vista preliminar.")).toHaveClass("print-guard-notice");
    expect(document.querySelector(".print-sheets")).not.toBeNull();
    const css = [...document.querySelectorAll("style")].map((el) => el.textContent).join(" ");
    expect(css).toContain(".print-sheets { display: none; }");
    expect(css).toContain("[data-print-ready] .print-sheets { display: block; }");
  });
});

describe("orthodontic-records — Marca de avance en impresiones incompletas", () => {
  it("cada hoja de una historia incompleta lleva la marca; al imprimir usa la fecha y el avance del servidor", async () => {
    serve(recordResponse(), { clinicalFilledSteps: 4 });
    renderRecordRoutes("/historias/10/imprimir");
    const sheets = await screen.findAllByRole("article");
    for (const sheet of sheets) {
      expect(within(sheet).getByText(/^AVANCE · 1 de 7 pasos clínicos con datos · impreso el \d{2}\/\d{2}\/\d{4}$/)).toBeInTheDocument();
    }

    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole("button", { name: "Imprimir" }));

    await waitFor(() =>
      expect(within(sheets[0]).getByText("AVANCE · 4 de 7 pasos clínicos con datos · impreso el 05/10/2026")).toBeInTheDocument(),
    );
  });

  it("una historia completa se imprime sin la marca", async () => {
    serve(recordResponse(), { clinicalFilledSteps: 7 });
    renderRecordRoutes("/historias/10/imprimir");
    await screen.findAllByRole("article");

    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole("button", { name: "Imprimir" }));

    await waitFor(() => expect(print).toHaveBeenCalled());
    expect(screen.queryByText(/^AVANCE ·/)).not.toBeInTheDocument();
  });
});

