import type {
  CreateRecordRequest,
  RecordContent,
  RecordResponse,
  UpdateRecordRequest,
} from "@/modules/core/services/generated/model";
import type { RecordFormValues } from "../schemas/record";
import { completeValues } from "../schemas/recordDefaults";

/** Contenido vacío (todas las secciones presentes), como lo devuelve el backend para una historia nueva. */
export function emptyContent(): RecordContent {
  return {
    anamnesis: {},
    facial: {},
    functional: { suckingHabitTypes: ["NONE"] },
    occlusal: {},
    models: { transversal: { walaToEv: {} }, moyers: { lowerIncisors: {}, availableSpace: {} }, nance: { upperWidths: {}, lowerWidths: {} } },
    radiographic: {},
    diagnosis: { problemList: [], treatmentGoals: [] },
    signatures: {},
  };
}

/** Valores iniciales de una historia nueva; el tratante se propone con el nombre del usuario. */
export function emptyRecordValues(treatingDentist?: string): RecordFormValues {
  return completeValues({ treatingDentist: treatingDentist ?? "", patientName: "", content: emptyContent() });
}

/**
 * Respuesta del servidor → valores del formulario, con TODOS los campos presentes (los `null`
 * del JSON pasan a su valor vacío) y sin los campos que no se editan. Valores iniciales
 * completos: montar un paso no cuenta como cambio.
 */
export function toFormValues(record: RecordResponse): RecordFormValues {
  const clean = withoutNulls(record) as RecordResponse;
  const values = {
    treatingDentist: clean.treatingDentist,
    patientName: clean.patientName,
    documentType: clean.documentType,
    documentNumber: clean.documentNumber,
    patientSex: clean.patientSex,
    birthDate: clean.birthDate,
    birthPlace: clean.birthPlace,
    address: clean.address,
    phone: clean.phone,
    treatmentStartDate: clean.treatmentStartDate,
    content: clean.content,
  };
  return completeValues(values);
}

/** Valores del formulario → cuerpo del POST (sin vacíos: el servidor los trata como nulos). */
export function toCreateRequest(values: RecordFormValues): CreateRecordRequest {
  return withoutEmpty(values) as CreateRecordRequest;
}

/** Valores del formulario + versión cargada → cuerpo del PUT. */
export function toUpdateRequest(values: RecordFormValues, version: number): UpdateRecordRequest {
  return { ...(withoutEmpty(values) as CreateRecordRequest), version };
}

/** Copia profunda sin `null` (los arrays se conservan). */
function withoutNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutNulls);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).filter(([, v]) => v !== null).map(([k, v]) => [k, withoutNulls(v)]),
    );
  }
  return value;
}

/** Copia profunda sin `null`, `undefined` ni cadenas vacías. */
function withoutEmpty(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutEmpty);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .map(([k, v]) => [k, withoutEmpty(v)]),
    );
  }
  return value;
}
