import { z } from "zod";
import {
  AnamnesisCooperation,
  AnamnesisOralHygiene,
  AngleRelationAngleClass,
  CreateRecordRequestDocumentType,
  CreateRecordRequestPatientSex,
  FacialAnalysisChinNeckAngle,
  FacialAnalysisChinNeckLine,
  FacialAnalysisConvexity,
  FacialAnalysisFacialPattern,
  FacialAnalysisFacialType,
  FacialAnalysisLipAnteroposteriorRelation,
  FacialAnalysisLipSeal,
  FacialAnalysisMentolabialSulcus,
  FacialAnalysisNasolabialAngle,
  FacialAnalysisPatternIIAfai,
  FacialAnalysisPatternIIFeaturesItem,
  FacialAnalysisPatternIIIFeaturesItem,
  FacialAnalysisZygomaticProjection,
  FunctionalAnalysisBreathing,
  FunctionalAnalysisBruxism,
  FunctionalAnalysisLingualFrenulum,
  FunctionalAnalysisLipClosure,
  FunctionalAnalysisSuckingHabitTypesItem,
  FunctionalAnalysisSwallowing,
  FunctionalAnalysisTongueLateralSidesItem,
  FunctionalAnalysisTongueActivity,
  FunctionalAnalysisUpperLip,
  MidlinePosition,
  OcclusalAnalysisCrossbiteType,
  OcclusalAnalysisSpeeCurve,
  OcclusalAnalysisTransverse,
  OcclusalAnalysisVertical,
  RadiographicAnalysisCephalometricAnalysesItem,
} from "@/modules/core/services/generated/model";
import { isValidFdi } from "../utils/fdi";
import { today } from "../utils/age";

/**
 * Schema del formulario de la historia, en paridad con el backend (docs/coding-style.md §7):
 * `CreateRecordRequest`/`UpdateRecordRequest`, `PatientFields.Consistent`, `ContentLimits`,
 * `Midline.Consistent` y `@FdiTooth`. Salvo el nombre del paciente, nada es obligatorio
 * (borrador). Las reglas condicionales se aplican al guardar en el servidor; aquí solo se valida
 * el formato de lo escrito.
 */

export const SHORT_TEXT = 200;
export const LONG_TEXT = 4000;
export const LIST_ITEM = 500;
export const LIST_ITEMS = 30;
export const MAX_MM = 30;
export const MIN_MIDLINE_MM = 0.5;
/** Medidas de los análisis de modelos: 0–99,9 mm con un decimal (paridad con `MAX_MODEL_MM`). */
export const MAX_MODEL_MM = 99.9;
/** Ancho mesiodistal de una pieza: 4,0–13,0 mm (como `ContentLimits.MIN/MAX_TOOTH_MM`). */
export const MIN_TOOTH_MM = 4;
export const MAX_TOOTH_MM = 13;

const tooLong = (max: number) => `Máximo ${max} caracteres.`;
const text = (max: number) => z.string().max(max, tooLong(max)).nullish();
const one = <V extends string>(values: Record<string, V>) => z.enum(values).nullish();
const many = <V extends string>(values: Record<string, V>) => z.array(z.enum(values)).nullish();

/** Número con a lo sumo un decimal dentro de [min, max]. */
const decimal = (min: number, max: number, unit: string) =>
  z
    .number({ error: "Ingresa un número." })
    .min(min, `Mínimo ${min} ${unit}.`)
    .max(max, `Máximo ${max} ${unit}.`)
    .refine((n) => Math.abs(n * 10 - Math.round(n * 10)) < 1e-9, "Máximo un decimal.")
    .nullish();

const teeth = (anteriorOnly: boolean) =>
  z.array(z.number().refine((t) => isValidFdi(t, anteriorOnly), "Pieza dental inválida (notación FDI: 11–48 o 51–85).")).nullish();

const midline = z
  .object({
    position: one(MidlinePosition),
    deviationMm: decimal(0, MAX_MM, "mm"),
  })
  .superRefine((m, ctx) => {
    const deviated = m.position === "DEVIATED_RIGHT" || m.position === "DEVIATED_LEFT";
    if (deviated && (m.deviationMm == null || m.deviationMm < MIN_MIDLINE_MM)) {
      ctx.addIssue({ code: "custom", path: ["deviationMm"], message: "Indica la desviación en milímetros (mínimo 0,5 mm)." });
    }
  })
  .nullish();

const angleRelation = z.object({ angleClass: one(AngleRelationAngleClass), detail: text(SHORT_TEXT) }).nullish();
const sideRelations = z.object({ right: angleRelation, left: angleRelation }).nullish();

const anamnesis = z.object({
  chiefComplaint: text(LONG_TEXT),
  personalPreferences: text(LONG_TEXT),
  cooperation: one(AnamnesisCooperation),
  oralHygiene: one(AnamnesisOralHygiene),
  suckingHabits: one(AnamnesisOralHygiene),
  menarche: one(AnamnesisOralHygiene),
  medicalHistory: text(LONG_TEXT),
  accidentsHistory: text(LONG_TEXT),
  familyStructure: text(LONG_TEXT),
  generalTreatmentNeeds: text(LONG_TEXT),
  heredity: text(LONG_TEXT),
});

const facial = z.object({
  facialType: one(FacialAnalysisFacialType),
  convexity: one(FacialAnalysisConvexity),
  facialThirds: one(FacialAnalysisLipSeal),
  facialThirdsNotes: text(LONG_TEXT),
  lipSeal: one(FacialAnalysisLipSeal),
  lipAnteroposteriorRelation: one(FacialAnalysisLipAnteroposteriorRelation),
  restSymmetry: one(FacialAnalysisLipSeal),
  restSymmetryNotes: text(LONG_TEXT),
  openingSymmetry: one(FacialAnalysisLipSeal),
  openingSymmetryNotes: text(LONG_TEXT),
  nasolabialAngle: one(FacialAnalysisNasolabialAngle),
  mentolabialSulcus: one(FacialAnalysisMentolabialSulcus),
  zygomaticProjection: one(FacialAnalysisZygomaticProjection),
  chinNeckLine: one(FacialAnalysisChinNeckLine),
  chinNeckAngle: one(FacialAnalysisChinNeckAngle),
  facialPattern: one(FacialAnalysisFacialPattern),
  patternIIFeatures: many(FacialAnalysisPatternIIFeaturesItem),
  patternIIAfai: one(FacialAnalysisPatternIIAfai),
  patternIIIFeatures: many(FacialAnalysisPatternIIIFeaturesItem),
  patternIIIAfai: one(FacialAnalysisPatternIIAfai),
});

const functional = z.object({
  breathing: one(FunctionalAnalysisBreathing),
  swallowing: one(FunctionalAnalysisSwallowing),
  lipClosure: one(FunctionalAnalysisLipClosure),
  tongueActivity: one(FunctionalAnalysisTongueActivity),
  tongueLateralSides: many(FunctionalAnalysisTongueLateralSidesItem),
  upperLip: one(FunctionalAnalysisUpperLip),
  lowerLip: one(FunctionalAnalysisUpperLip),
  masseter: one(FunctionalAnalysisUpperLip),
  mentalis: one(FunctionalAnalysisUpperLip),
  suckingHabitTypes: many(FunctionalAnalysisSuckingHabitTypesItem),
  lingualFrenulum: one(FunctionalAnalysisLingualFrenulum),
  snoring: one(AnamnesisOralHygiene),
  bruxism: one(FunctionalAnalysisBruxism),
  bruxismTeeth: teeth(false),
});

const occlusal = z.object({
  transverse: one(OcclusalAnalysisTransverse),
  crossbiteSide: one(FunctionalAnalysisTongueLateralSidesItem),
  crossbiteType: one(OcclusalAnalysisCrossbiteType),
  vertical: one(OcclusalAnalysisVertical),
  deepBitePercent: decimal(0, 100, "%"),
  openBiteMm: decimal(0, MAX_MM, "mm"),
  speeCurve: one(OcclusalAnalysisSpeeCurve),
  speeCurveDetail: text(SHORT_TEXT),
  anteroposteriorNormal: z.boolean().nullish(),
  overjetMm: decimal(0, MAX_MM, "mm"),
  anteriorCrossbiteTeeth: teeth(true),
  midlineUpper: midline,
  midlineLower: midline,
  canineRelation: sideRelations,
  molarRelation: sideRelations,
  miDiffersFromRc: z.boolean().nullish(),
  canineRelationMi: sideRelations,
  mihDiffersFromRc: z.boolean().nullish(),
  canineRelationMih: sideRelations,
  dentalAnomalies: text(LONG_TEXT),
  tmjCondition: text(LONG_TEXT),
  familyMalocclusion: one(AnamnesisOralHygiene),
  familyMalocclusionWho: text(SHORT_TEXT),
});

const modelMm = decimal(0, MAX_MODEL_MM, "mm");
/** Ancho mesiodistal de una pieza: lo que mide un diente real. */
const toothMm = decimal(MIN_TOOTH_MM, MAX_TOOTH_MM, "mm");

const transversal = z.object({
  intercanineUpper: modelMm,
  intercanineLower: modelMm,
  intermolarUpper: modelMm,
  intermolarLower: modelMm,
  walaWidth: modelMm,
  xPcWidth: modelMm,
  xPrimePcWidth: modelMm,
  xIdealWidth: modelMm,
  walaToEv: z
    .object({
      canine: modelMm,
      firstPremolar: modelMm,
      secondPremolar: modelMm,
      firstMolar: modelMm,
      secondMolar: modelMm,
    })
    .nullish(),
  interpretation: text(LONG_TEXT),
});

const moyers = z.object({
  analysisDate: z
    .string()
    .refine((d) => !d || d <= today(), "La fecha del análisis no puede ser futura.")
    .nullish(),
  lowerIncisors: z
    .object({ tooth42: toothMm, tooth41: toothMm, tooth31: toothMm, tooth32: toothMm })
    .nullish(),
  availableSpace: z
    .object({ mandibleRight: modelMm, mandibleLeft: modelMm, maxillaRight: modelMm, maxillaLeft: modelMm })
    .nullish(),
  crowdingPositive: text(SHORT_TEXT),
  crowdingNeutral: text(SHORT_TEXT),
  crowdingNegative: text(SHORT_TEXT),
  interpretation: text(LONG_TEXT),
});

/** Anchos de las piezas que se miden en Nance, por arcada (de mesial a mesial del 1er molar). */
const upperWidths = z
  .object({
    tooth15: toothMm,
    tooth14: toothMm,
    tooth13: toothMm,
    tooth12: toothMm,
    tooth11: toothMm,
    tooth21: toothMm,
    tooth22: toothMm,
    tooth23: toothMm,
    tooth24: toothMm,
    tooth25: toothMm,
  })
  .nullish();
const lowerWidths = z
  .object({
    tooth45: toothMm,
    tooth44: toothMm,
    tooth43: toothMm,
    tooth42: toothMm,
    tooth41: toothMm,
    tooth31: toothMm,
    tooth32: toothMm,
    tooth33: toothMm,
    tooth34: toothMm,
    tooth35: toothMm,
  })
  .nullish();

const nance = z.object({
  analysisDate: z
    .string()
    .refine((d) => !d || d <= today(), "La fecha del análisis no puede ser futura.")
    .nullish(),
  availableUpper: modelMm,
  availableLower: modelMm,
  upperWidths,
  lowerWidths,
  conclusionUpper: text(SHORT_TEXT),
  conclusionLower: text(SHORT_TEXT),
  interpretation: text(LONG_TEXT),
});

const bolton = z.object({
  analysisDate: z
    .string()
    .refine((d) => !d || d <= today(), "La fecha del análisis no puede ser futura.")
    .nullish(),
  firstMolars: z.object({ tooth16: toothMm, tooth26: toothMm, tooth46: toothMm, tooth36: toothMm }).nullish(),
  incisors: z
    .object({
      tooth12: toothMm,
      tooth11: toothMm,
      tooth21: toothMm,
      tooth22: toothMm,
      tooth42: toothMm,
      tooth41: toothMm,
      tooth31: toothMm,
      tooth32: toothMm,
    })
    .nullish(),
  interpretation: text(LONG_TEXT),
});

const models = z.object({ transversal, moyers, nance, bolton });

const radiographic = z.object({
  panoramicDiagnosis: text(LONG_TEXT),
  cephalometricAnalyses: many(RadiographicAnalysisCephalometricAnalysesItem),
  apicalBases: text(LONG_TEXT),
  growthTendency: text(LONG_TEXT),
  dentoalveolar: text(LONG_TEXT),
  others: text(LONG_TEXT),
});

const itemList = z.array(z.string().max(LIST_ITEM, tooLong(LIST_ITEM))).max(LIST_ITEMS, `Máximo ${LIST_ITEMS} ítems.`).nullish();

const diagnosis = z.object({
  generalDiagnosis: text(LONG_TEXT),
  problemList: itemList,
  treatmentGoals: itemList,
  treatmentPlan1: text(LONG_TEXT),
  treatmentPlan2: text(LONG_TEXT),
  treatmentSequence: text(LONG_TEXT),
  nextStages: text(LONG_TEXT),
  finalTreatmentPlan: text(LONG_TEXT),
});

const signatures = z.object({
  patientSignatureName: text(SHORT_TEXT),
  guardianName: text(SHORT_TEXT),
  guardianRelationship: text(SHORT_TEXT),
  supervisor1Name: text(SHORT_TEXT),
  supervisor2Name: text(SHORT_TEXT),
  treatingSignatureName: text(SHORT_TEXT),
});

const DOCUMENT_PATTERNS: Record<CreateRecordRequestDocumentType, { regex: RegExp; message: string }> = {
  DNI: { regex: /^\d{8}$/, message: "El DNI debe tener 8 dígitos." },
  FOREIGNER_CARD: { regex: /^\d{9}$/, message: "El carné de extranjería debe tener 9 dígitos." },
  PASSPORT: { regex: /^\d{6,12}$/, message: "El pasaporte debe tener entre 6 y 12 dígitos." },
};

export const recordFormSchema = z
  .object({
    treatingDentist: text(120),
    patientName: z.string().trim().min(1, "Indica el nombre del paciente.").max(120, tooLong(120)),
    documentType: one(CreateRecordRequestDocumentType),
    documentNumber: text(12),
    patientSex: one(CreateRecordRequestPatientSex),
    birthDate: z.string().nullish(),
    birthPlace: text(120),
    address: text(200),
    phone: text(20),
    treatmentStartDate: z.string().nullish(),
    content: z.object({
      schemaVersion: z.number().nullish(),
      anamnesis,
      facial,
      functional,
      occlusal,
      models,
      radiographic,
      diagnosis,
      signatures,
    }),
  })
  .superRefine((r, ctx) => {
    const number = r.documentNumber?.trim() ?? "";
    if (!r.documentType && number) {
      ctx.addIssue({ code: "custom", path: ["documentType"], message: "Indica el tipo de documento." });
    } else if (r.documentType && !number) {
      ctx.addIssue({ code: "custom", path: ["documentNumber"], message: "Indica el número del documento." });
    } else if (r.documentType && !DOCUMENT_PATTERNS[r.documentType].regex.test(number)) {
      ctx.addIssue({ code: "custom", path: ["documentNumber"], message: DOCUMENT_PATTERNS[r.documentType].message });
    }
    if (r.birthDate && r.birthDate > today()) {
      ctx.addIssue({ code: "custom", path: ["birthDate"], message: "La fecha de nacimiento no puede ser futura." });
    }
    if (r.birthDate && r.treatmentStartDate && r.treatmentStartDate < r.birthDate) {
      ctx.addIssue({
        code: "custom",
        path: ["treatmentStartDate"],
        message: "La fecha de inicio de tratamiento no puede ser anterior a la de nacimiento.",
      });
    }
  });

export type RecordFormValues = z.infer<typeof recordFormSchema>;
