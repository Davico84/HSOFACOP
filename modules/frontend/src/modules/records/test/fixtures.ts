import type { PageResponseRecordSummaryResponse, RecordResponse, RecordSummaryResponse } from "@/modules/core/services/generated/model";
import { emptyContent } from "../utils/recordForm";

/** Historia como la devuelve el backend (con `null` en lo vacío, como el JSON real). */
export function recordResponse(overrides: Partial<RecordResponse> = {}): RecordResponse {
  const base = {
    id: 10,
    recordNumber: "AOC-0001",
    authorId: 1,
    authorName: "Dra. María Torres",
    treatingDentist: "Dra. María Torres",
    patientName: "Ana Quispe",
    documentType: null,
    documentNumber: null,
    patientSex: null,
    birthDate: null,
    birthPlace: null,
    address: null,
    phone: null,
    treatmentStartDate: null,
    ageYears: null,
    content: { schemaVersion: 1, ...emptyContent() },
    version: 0,
    createdAt: "2026-10-01T10:00:00Z",
    updatedAt: "2026-10-01T10:00:00Z",
  } as unknown as RecordResponse;
  return { ...base, ...overrides };
}

export function summary(overrides: Partial<RecordSummaryResponse> = {}): RecordSummaryResponse {
  return {
    id: 10,
    recordNumber: "AOC-0001",
    patientName: "Ana Quispe",
    treatingDentist: "Dra. María Torres",
    authorName: "Dra. María Torres",
    updatedAt: "2026-10-01T10:00:00Z",
    patientLocked: false,
    ...overrides,
  };
}

export function page(content: RecordSummaryResponse[], pageNumber = 0, totalPages = 1): PageResponseRecordSummaryResponse {
  return { content, page: pageNumber, size: 20, totalElements: content.length, totalPages, last: pageNumber >= totalPages - 1 };
}
