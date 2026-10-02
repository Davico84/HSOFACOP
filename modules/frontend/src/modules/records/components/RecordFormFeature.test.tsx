import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import type { RecordResponse, UpdateRecordRequest } from "@/modules/core/services/generated/model";
import { recordResponse } from "../test/fixtures";
import { renderRecordRoutes } from "../test/renderRecordRoutes";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

/** Backend en memoria de una historia: GET/PUT con control de versión (409) y POST de creación. */
function mockRecord(initial: Partial<RecordResponse> = {}) {
  let record = recordResponse(initial);
  const calls = { post: 0, put: [] as UpdateRecordRequest[] };
  server.use(
    http.get("*/api/orthodontic-records/:id", ({ params }) =>
      Number(params.id) === record.id
        ? HttpResponse.json(record)
        : HttpResponse.json({ type: "/errors/record-not-found", detail: "No se encontró la historia clínica." }, { status: 404 }),
    ),
    http.put("*/api/orthodontic-records/:id", async ({ request }) => {
      const body = (await request.json()) as UpdateRecordRequest;
      calls.put.push(body);
      if (body.version !== record.version) {
        return HttpResponse.json({ type: "/errors/stale-record", detail: "La historia clínica cambió." }, { status: 409 });
      }
      record = { ...record, ...body, content: body.content ?? record.content, version: record.version + 1 } as RecordResponse;
      return HttpResponse.json(record);
    }),
    http.post("*/api/orthodontic-records", async ({ request }) => {
      calls.post += 1;
      const body = (await request.json()) as Partial<RecordResponse>;
      record = { ...recordResponse(), ...body, id: 10, recordNumber: "AEO-001", version: 0 } as RecordResponse;
      return HttpResponse.json(record, { status: 201 });
    }),
  );
  return { calls, bump: () => (record = { ...record, version: record.version + 1 }) };
}

const stepHeading = (title: RegExp) => screen.findByRole("heading", { level: 2, name: title });

beforeEach(() => {
  toast.success.mockClear();
  toast.error.mockClear();
});

describe("orthodontic-records — Crear una historia", () => {
  it("con solo el nombre del paciente se crea y abre el paso 2 en su URL", async () => {
    const { calls } = mockRecord();
    const { router } = renderRecordRoutes("/historias/nueva");

    expect(screen.getByLabelText("Odontólogo tratante")).toHaveValue("Dra. María Torres");
    await userEvent.type(screen.getByRole("textbox", { name: "Paciente" }), "Ana Quispe");
    await userEvent.click(screen.getByRole("button", { name: /Crear historia/ }));

    await stepHeading(/Análisis facial/);
    expect(calls.post).toBe(1);
    expect(router.state.location.pathname).toBe("/historias/10");
    expect(router.state.location.search).toBe("?paso=2");
  });

  it("sin nombre del paciente no se crea y el error aparece junto al campo", async () => {
    const { calls } = mockRecord();
    renderRecordRoutes("/historias/nueva");

    await userEvent.click(screen.getByRole("button", { name: /Crear historia/ }));

    expect(await screen.findByText("Indica el nombre del paciente.")).toBeInTheDocument();
    expect(calls.post).toBe(0);
  });
});

describe("orthodontic-records — Formulario por pasos con guardado de borrador", () => {
  it("avanzar con cambios guarda y muestra el paso siguiente", async () => {
    const { calls } = mockRecord();
    renderRecordRoutes("/historias/10?paso=2");
    await stepHeading(/Análisis facial/);

    await userEvent.click(screen.getByRole("radio", { name: "Mesofacial" }));
    await userEvent.click(screen.getByRole("button", { name: /Siguiente/ }));

    await stepHeading(/Análisis funcional/);
    expect(calls.put).toHaveLength(1);
    expect(calls.put[0].content?.facial.facialType).toBe("MESOFACIAL");
    expect(calls.put[0].version).toBe(0);
  });

  it("sin cambios cambia de paso sin enviar nada", async () => {
    const { calls } = mockRecord();
    renderRecordRoutes("/historias/10?paso=1");
    await stepHeading(/Paciente y anamnesis/);

    await userEvent.click(screen.getByRole("button", { name: /Siguiente/ }));

    await stepHeading(/Análisis facial/);
    expect(calls.put).toHaveLength(0);
  });

  it("saltar a un paso desde el indicador guarda antes", async () => {
    const { calls } = mockRecord();
    renderRecordRoutes("/historias/10?paso=1");
    await stepHeading(/Paciente y anamnesis/);

    await userEvent.type(screen.getByLabelText("Domicilio"), "Av. Ejército 512");
    await userEvent.click(screen.getByRole("button", { name: /Diagnóstico y planes/ }));

    await stepHeading(/Diagnóstico y planes/);
    expect(calls.put[0].address).toBe("Av. Ejército 512");
  });

  it("un error de validación deja el paso y no envía nada", async () => {
    const { calls } = mockRecord();
    renderRecordRoutes("/historias/10?paso=1");
    await stepHeading(/Paciente y anamnesis/);

    await userEvent.click(screen.getByRole("radio", { name: "DNI" }));
    await userEvent.type(screen.getByLabelText("Número"), "7412589");
    await userEvent.click(screen.getByRole("button", { name: /Siguiente/ }));

    expect(await screen.findByText("El DNI debe tener 8 dígitos.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Paciente y anamnesis/ })).toBeInTheDocument();
    expect(calls.put).toHaveLength(0);
  });

  it("un error del servidor por campo se muestra junto al campo", async () => {
    mockRecord();
    server.use(
      http.put("*/api/orthodontic-records/:id", () =>
        HttpResponse.json(
          { type: "/errors/validation-error", detail: "Uno o más campos son inválidos.",
            errors: [{ field: "address", message: "Domicilio no válido según el servidor." }] },
          { status: 400 },
        ),
      ),
    );
    renderRecordRoutes("/historias/10?paso=1");
    await stepHeading(/Paciente y anamnesis/);

    await userEvent.type(screen.getByLabelText("Domicilio"), "x");
    await userEvent.click(screen.getByRole("button", { name: /Siguiente/ }));

    expect(await screen.findByText("Domicilio no válido según el servidor.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Paciente y anamnesis/ })).toBeInTheDocument();
  });

  it("un fallo de red deja el paso, conserva lo escrito y ofrece reintentar", async () => {
    mockRecord();
    server.use(http.put("*/api/orthodontic-records/:id", () => HttpResponse.error()));
    renderRecordRoutes("/historias/10?paso=1");
    await stepHeading(/Paciente y anamnesis/);

    await userEvent.type(screen.getByLabelText("Domicilio"), "Av. Ejército 512");
    await userEvent.click(screen.getByRole("button", { name: /Siguiente/ }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.error.mock.calls[0][1]).toMatchObject({ action: { label: "Reintentar" } });
    expect(screen.getByLabelText("Domicilio")).toHaveValue("Av. Ejército 512");
    expect(screen.getByRole("heading", { level: 2, name: /Paciente y anamnesis/ })).toBeInTheDocument();
  });

  it("salir con cambios sin guardar pide confirmación", async () => {
    mockRecord();
    const { router } = renderRecordRoutes("/historias/10?paso=1");
    await stepHeading(/Paciente y anamnesis/);

    await userEvent.type(screen.getByLabelText("Domicilio"), "x");
    await act(() => router.navigate("/fuera"));

    expect(await screen.findByRole("alertdialog", { name: "¿Salir sin guardar?" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Salir sin guardar" }));
    expect(await screen.findByText("Otra sección")).toBeInTheDocument();
  });
});

describe("orthodontic-records — Abrir un paso no cuenta como cambio", () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])("paso %i recién abierto: sin cambios y con 'Vista previa' disponible", async (paso) => {
    mockRecord({ patientSex: "FEMALE", birthDate: "1990-01-01" });
    renderRecordRoutes(`/historias/10?paso=${paso}`);
    await screen.findByRole("heading", { level: 2 });

    expect(screen.queryByText(/Cambios sin guardar/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vista previa de impresión de la historia AEO-001" })).toBeInTheDocument();
  });
});

describe("orthodontic-records — Edición concurrente y acceso", () => {
  it("guardar sobre una versión desactualizada (409) muestra el aviso y permite recargar", async () => {
    const backend = mockRecord();
    renderRecordRoutes("/historias/10?paso=1");
    await stepHeading(/Paciente y anamnesis/);
    backend.bump(); // otra sesión guardó

    await userEvent.type(screen.getByLabelText("Domicilio"), "x");
    await userEvent.click(screen.getByRole("button", { name: /Siguiente/ }));

    expect(await screen.findByText(/La historia cambió desde que la abriste/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Recargar historia" }));
    await waitFor(() => expect(screen.queryByText(/La historia cambió desde que la abriste/)).not.toBeInTheDocument());
    expect(screen.getByLabelText("Domicilio")).toHaveValue("");
  });

  it("una historia ajena o inexistente muestra 'Historia no encontrada'", async () => {
    mockRecord();
    renderRecordRoutes("/historias/99");
    expect(await screen.findByRole("heading", { name: "Historia no encontrada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a las historias" })).toHaveAttribute("href", "/historias");
  });
});

describe("orthodontic-records — Secciones clínicas de la fase 1", () => {
  it("selección única: elegir otra opción reemplaza la anterior y pulsar la marcada la quita", async () => {
    mockRecord();
    renderRecordRoutes("/historias/10?paso=2");
    await stepHeading(/Análisis facial/);

    await userEvent.click(screen.getByRole("radio", { name: "Dolicofacial" }));
    await userEvent.click(screen.getByRole("radio", { name: "Braquifacial" }));
    expect(screen.getByRole("radio", { name: "Braquifacial" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Dolicofacial" })).not.toBeChecked();

    await userEvent.click(screen.getByRole("radio", { name: "Braquifacial" }));
    expect(screen.getByRole("radio", { name: "Braquifacial" })).not.toBeChecked();
  });

  it("la pregunta de la menstruación solo aparece con sexo femenino", async () => {
    mockRecord();
    renderRecordRoutes("/historias/10?paso=1");
    await stepHeading(/Paciente y anamnesis/);

    expect(screen.queryByText("¿La 1ª menstruación ya ocurrió?")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Femenino" }));
    expect(screen.getByText("¿La 1ª menstruación ya ocurrió?")).toBeInTheDocument();
  });

  it("hábitos de succión: 'No' por defecto y excluyente", async () => {
    mockRecord();
    renderRecordRoutes("/historias/10?paso=3");
    await stepHeading(/Análisis funcional/);

    const no = screen.getByRole("checkbox", { name: "No" });
    expect(no).toBeChecked();
    await userEvent.click(screen.getByRole("checkbox", { name: "Dedos" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Onicofagia" }));
    expect(no).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Dedos" })).toBeChecked();

    await userEvent.click(no);
    expect(screen.getByRole("checkbox", { name: "Dedos" })).not.toBeChecked();
  });

  it("piezas con desgaste aparecen solo con 'Sí, con presencia de desgastes'", async () => {
    mockRecord();
    renderRecordRoutes("/historias/10?paso=3");
    await stepHeading(/Análisis funcional/);

    expect(screen.queryByRole("checkbox", { name: "Pieza 26" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Sí, con presencia de desgastes" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Pieza 26" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Pieza 55" }));
    expect(screen.getByRole("checkbox", { name: "Pieza 55" })).toBeChecked();
  });

  it("anteroposterior normal oculta overjet y mordida cruzada anterior", async () => {
    mockRecord();
    renderRecordRoutes("/historias/10?paso=4");
    await stepHeading(/Análisis oclusal/);

    expect(screen.getByLabelText("Overjet aumentado")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("checkbox", { name: "Normal" }));
    expect(screen.queryByLabelText("Overjet aumentado")).not.toBeInTheDocument();
  });

  it("la lista de problemas se arma ítem por ítem y se reordena", async () => {
    const { calls } = mockRecord();
    renderRecordRoutes("/historias/10?paso=7");
    await stepHeading(/Diagnóstico y planes/);

    const input = screen.getByPlaceholderText("Nuevo problema");
    await userEvent.type(input, "Overjet aumentado{Enter}");
    await userEvent.type(input, "Mordida profunda{Enter}");
    await userEvent.click(screen.getByRole("button", { name: "Subir problema 2" }));
    await userEvent.click(screen.getByRole("button", { name: /Guardar/ }));

    await waitFor(() => expect(calls.put).toHaveLength(1));
    expect(calls.put[0].content?.diagnosis.problemList).toEqual(["Mordida profunda", "Overjet aumentado"]);
  });

  it("firmas: con paciente menor de edad se pide el apoderado", async () => {
    mockRecord({ birthDate: "2012-05-20", treatmentStartDate: "2026-05-19", ageYears: 13 });
    renderRecordRoutes("/historias/10?paso=8");
    await stepHeading(/Firmas/);

    expect(screen.getByLabelText("Nombre del apoderado")).toBeInTheDocument();
    expect(screen.getByLabelText("Parentesco")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nombre del paciente")).not.toBeInTheDocument();
  });
});

describe("orthodontic-records — Análisis transversal de los modelos (paso 5)", () => {
  it("el paso 5 sigue al análisis oclusal y el radiográfico pasa a ser el 6", async () => {
    mockRecord();
    renderRecordRoutes("/historias/10?paso=4");
    await screen.findByRole("heading", { level: 2, name: /Análisis oclusal/ });

    await userEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    expect(await screen.findByRole("heading", { level: 2, name: /^5\. Análisis de modelos/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    expect(await screen.findByRole("heading", { level: 2, name: /^6\. Análisis radiográfico/ })).toBeInTheDocument();
  });

  it("muestra en vivo la diferencia con el promedio (por sexo) y con la norma WALA–EV, y lo guarda", async () => {
    const { calls } = mockRecord({ patientSex: "FEMALE" });
    renderRecordRoutes("/historias/10?paso=5");
    await screen.findByRole("heading", { level: 2, name: /Análisis de modelos/ });

    await userEvent.type(screen.getByLabelText("AMS: ancho molar superior"), "50.1");
    expect(screen.getByText("promedio 52,4 mm · −2,3")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Distancia WALA a EV, 1er molar inferior (mm)"), "2.6");
    expect(screen.getByLabelText("Diferencia 1er molar inferior")).toHaveTextContent("+0,6");
    await userEvent.type(screen.getByLabelText("Ancho X ideal"), "50");

    await userEvent.click(screen.getByRole("button", { name: /Guardar/ }));
    await waitFor(() => expect(calls.put).toHaveLength(1));
    const t = calls.put[0].content?.models.transversal;
    expect(t?.intermolarUpper).toBe(50.1);
    expect(t?.walaToEv?.firstMolar).toBe(2.6);
    expect(t?.xIdealWidth).toBe(50);
  });

  it("sin sexo indicado no compara con el promedio", async () => {
    mockRecord();
    renderRecordRoutes("/historias/10?paso=5");
    await screen.findByRole("heading", { level: 2, name: /Análisis de modelos/ });
    expect(screen.getAllByText("Indica el sexo del paciente (paso 1) para comparar con el promedio.")).toHaveLength(2);
  });
});

describe("orthodontic-records — Análisis de Moyers (paso 5)", () => {
  it("calcula en vivo suma, requerido al 75 % y diferencias; la predisposición la escribe el odontólogo", async () => {
    const { calls } = mockRecord({ treatmentStartDate: "2026-09-15" });
    renderRecordRoutes("/historias/10?paso=5");
    await screen.findByRole("heading", { level: 3, name: "Análisis de Moyers" });

    await userEvent.type(screen.getByLabelText("Fecha del análisis"), "2026-09-01");
    for (const [tooth, value] of [["42", "6"], ["41", "5.5"], ["31", "5.4"], ["32", "6.1"]]) {
      await userEvent.type(screen.getByLabelText(`Pieza ${tooth}`), value);
    }
    expect(screen.getByText("23,0 mm")).toBeInTheDocument();
    for (const [side, value] of [["Mandíbula derecho", "21"], ["Mandíbula izquierdo", "22.6"], ["Maxilar derecho", "23.5"], ["Maxilar izquierdo", "22.6"]]) {
      await userEvent.type(screen.getByLabelText(`Espacio disponible, ${side} (mm)`), value);
    }
    expect(screen.getByLabelText("Espacio requerido, Mandíbula derecho")).toHaveTextContent("22,2");
    expect(screen.getByLabelText("Espacio requerido, Maxilar izquierdo")).toHaveTextContent("22,6");
    expect(screen.getByLabelText("Diferencia, Mandíbula derecho")).toHaveTextContent("−1,2");
    expect(screen.getByLabelText("Diferencia, Maxilar izquierdo")).toHaveTextContent("0,0");
    expect(screen.getByLabelText("Negativo")).toHaveValue("");
    await userEvent.type(screen.getByLabelText("Negativo"), "Mandíbula derecho");

    await userEvent.click(screen.getByRole("button", { name: /Guardar/ }));
    await waitFor(() => expect(calls.put).toHaveLength(1));
    const y = calls.put[0].content?.models.moyers;
    expect(y?.analysisDate).toBe("2026-09-01");
    expect(y?.lowerIncisors).toEqual({ tooth42: 6, tooth41: 5.5, tooth31: 5.4, tooth32: 6.1 });
    expect(y?.availableSpace?.mandibleRight).toBe(21);
    expect(y?.crowdingNegative).toBe("Mandíbula derecho");
    expect(y?.crowdingPositive).toBeUndefined();
  });

  it("una suma fuera de la tabla avisa y no calcula el requerido", async () => {
    mockRecord();
    renderRecordRoutes("/historias/10?paso=5");
    await screen.findByRole("heading", { level: 3, name: "Análisis de Moyers" });

    for (const [tooth, value] of [["42", "4.5"], ["41", "4.5"], ["31", "4.5"], ["32", "5.5"]]) {
      await userEvent.type(screen.getByLabelText(`Pieza ${tooth}`), value);
    }
    expect(screen.getByText("Fuera de la tabla de Moyers (19,5–29,0 mm).")).toBeInTheDocument();
    expect(screen.getByLabelText("Espacio requerido, Mandíbula derecho")).toHaveTextContent("—");
  });

  it("una fecha futura no se guarda y el error aparece junto al campo", async () => {
    const { calls } = mockRecord();
    renderRecordRoutes("/historias/10?paso=5");
    await screen.findByRole("heading", { level: 3, name: "Análisis de Moyers" });

    await userEvent.type(screen.getByLabelText("Fecha del análisis"), "2999-01-01");
    await userEvent.click(screen.getByRole("button", { name: /Guardar/ }));
    expect(await screen.findByText("La fecha del análisis no puede ser futura.")).toBeInTheDocument();
    expect(calls.put).toHaveLength(0);
  });
});
