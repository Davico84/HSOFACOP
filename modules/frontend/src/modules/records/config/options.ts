import type { ChoiceOption } from "@/modules/core/components/form/choiceTypes";
import {
  AnamnesisCooperation,
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
  AnamnesisOralHygiene,
  RadiographicAnalysisCephalometricAnalysesItem,
} from "@/modules/core/services/generated/model";

import convexidadConcavo from "@/assets/records/facial-guide/convexidad-concavo.png";
import convexidadConvexo from "@/assets/records/facial-guide/convexidad-convexo.png";
import convexidadRecto from "@/assets/records/facial-guide/convexidad-recto.png";
import caraCorta from "@/assets/records/facial-guide/cara-corta.png";
import caraLarga from "@/assets/records/facial-guide/cara-larga.png";
import cigomaticaAumentada from "@/assets/records/facial-guide/cigomatica-aumentada.png";
import cigomaticaDisminuida from "@/assets/records/facial-guide/cigomatica-disminuida.png";
import cigomaticaNormal from "@/assets/records/facial-guide/cigomatica-normal.png";
import labiosInferior from "@/assets/records/facial-guide/labios-inferior-adelante.png";
import labiosMisma from "@/assets/records/facial-guide/labios-misma-linea.png";
import labiosSuperior from "@/assets/records/facial-guide/labios-superior-adelante.png";
import patronI from "@/assets/records/facial-guide/patron-i.png";
import patronII from "@/assets/records/facial-guide/patron-ii.png";
import patronIII from "@/assets/records/facial-guide/patron-iii.png";
import tipoBraqui from "@/assets/records/facial-guide/tipo-braquifacial.png";
import tipoDolico from "@/assets/records/facial-guide/tipo-dolicofacial.png";
import tipoMeso from "@/assets/records/facial-guide/tipo-mesofacial.png";

export { default as anguloMentonCuelloImg } from "@/assets/records/facial-guide/angulo-menton-cuello.png";
export { default as anguloNasolabialImg } from "@/assets/records/facial-guide/angulo-nasolabial.png";
export { default as lineaMentonCuelloImg } from "@/assets/records/facial-guide/linea-menton-cuello.png";
export { default as selladoLabialImg } from "@/assets/records/facial-guide/sellado-labial.png";
export { default as simetriaImg } from "@/assets/records/facial-guide/simetria.png";
export { default as surcoMentolabialImg } from "@/assets/records/facial-guide/surco-mentolabial.png";
export { default as terciosImg } from "@/assets/records/facial-guide/tercios.png";

/**
 * Etiquetas (en español) de cada opción del contenido clínico: única fuente para el formulario y
 * la impresión. Las claves salen del contrato: un valor nuevo del backend no compila hasta que
 * tenga su etiqueta aquí. El orden es el del PDF.
 */
type Labels<V extends string> = Record<V, string>;

function choices<V extends string>(values: Record<string, V>, labels: Labels<V>, images?: Partial<Record<V, string>>): ChoiceOption<V>[] {
  return Object.values(values).map((value) => ({ value, label: labels[value], image: images?.[value] }));
}

// --- Paciente ---

export const documentTypeOptions = choices(CreateRecordRequestDocumentType, {
  DNI: "DNI", FOREIGNER_CARD: "Carné de extranjería", PASSPORT: "Pasaporte",
});
/** Abreviatura al imprimir junto al número. */
export const documentTypeShort: Labels<CreateRecordRequestDocumentType> = {
  DNI: "DNI", FOREIGNER_CARD: "CE", PASSPORT: "Pasaporte",
};
export const sexOptions = choices(CreateRecordRequestPatientSex, { FEMALE: "Femenino", MALE: "Masculino" });

// --- Comunes ---

export const yesNoOptions = choices(AnamnesisOralHygiene, { YES: "Sí", NO: "No" });
export const presenceOptions = choices(FacialAnalysisLipSeal, { PRESENT: "Presenta", ABSENT: "No presenta" });
export const sideOptions = choices(FunctionalAnalysisTongueLateralSidesItem, { RIGHT: "Derecho", LEFT: "Izquierdo" });
export const muscleOptions = choices(FunctionalAnalysisUpperLip, {
  NORMAL: "Normal", HYPOACTIVE: "Hipoactivo", HYPERACTIVE: "Hiperactivo",
});
export const afaiOptions = choices(FacialAnalysisPatternIIAfai, {
  INCREASED: "Con aumento de AFAI", DECREASED: "Con AFAI disminuida",
});
export const angleClassOptions = choices(AngleRelationAngleClass, {
  CLASS_I: "Clase I", CLASS_II: "Clase II", CLASS_III: "Clase III",
});

// --- Paso 1: anamnesis ---

export const cooperationOptions = choices(AnamnesisCooperation, { HIGH: "Alto", MEDIUM: "Medio", LOW: "Bajo" });

// --- Paso 2: análisis facial (Guía de análisis facial) ---

export const facialTypeOptions = choices(FacialAnalysisFacialType,
  { MESOFACIAL: "Mesofacial", DOLICHOFACIAL: "Dolicofacial", BRACHYFACIAL: "Braquifacial" },
  { MESOFACIAL: tipoMeso, DOLICHOFACIAL: tipoDolico, BRACHYFACIAL: tipoBraqui });
export const convexityOptions = choices(FacialAnalysisConvexity,
  { STRAIGHT: "Recto", CONVEX: "Convexo", CONCAVE: "Cóncavo" },
  { STRAIGHT: convexidadRecto, CONVEX: convexidadConvexo, CONCAVE: convexidadConcavo });
export const lipRelationOptions = choices(FacialAnalysisLipAnteroposteriorRelation,
  { UPPER_AHEAD: "Labio superior adelante del inferior", SAME_LINE: "Superior e inferior en la misma línea", LOWER_AHEAD: "Labio inferior adelante del superior" },
  { UPPER_AHEAD: labiosSuperior, SAME_LINE: labiosMisma, LOWER_AHEAD: labiosInferior });
export const nasolabialOptions = choices(FacialAnalysisNasolabialAngle, { NORMAL: "Normal", OPEN: "Abierto", DECREASED: "Disminuido" });
export const mentolabialOptions = choices(FacialAnalysisMentolabialSulcus, { NORMAL: "Normal", DEEP: "Profundo", SHALLOW: "Poco profundo" });
export const zygomaticOptions = choices(FacialAnalysisZygomaticProjection,
  { DECREASED: "Disminuida", NORMAL: "Normal", INCREASED: "Aumentada" },
  { DECREASED: cigomaticaDisminuida, NORMAL: cigomaticaNormal, INCREASED: cigomaticaAumentada });
export const chinNeckLineOptions = choices(FacialAnalysisChinNeckLine, { NORMAL: "Normal", INCREASED: "Aumentada", DECREASED: "Disminuida" });
export const chinNeckAngleOptions = choices(FacialAnalysisChinNeckAngle, { NORMAL: "Normal", OPEN: "Abierto", CLOSED: "Cerrado" });
export const facialPatternOptions = choices(FacialAnalysisFacialPattern,
  { PATTERN_I: "Patrón I", PATTERN_II: "Patrón II", PATTERN_III: "Patrón III", SHORT_FACE: "Cara corta", LONG_FACE: "Cara larga" },
  { PATTERN_I: patronI, PATTERN_II: patronII, PATTERN_III: patronIII, SHORT_FACE: caraCorta, LONG_FACE: caraLarga });
export const patternIIFeatureOptions = choices(FacialAnalysisPatternIIFeaturesItem, {
  MANDIBULAR_RETRUSION: "Retrusión mandibular", MAXILLARY_PROTRUSION: "Protrusión maxilar",
});
export const patternIIIFeatureOptions = choices(FacialAnalysisPatternIIIFeaturesItem, {
  MANDIBULAR_PROTRUSION: "Protrusión mandibular", MAXILLARY_RETRUSION: "Retrusión maxilar",
});

/** Valores de referencia de la Guía de análisis facial (ayuda bajo cada pregunta). */
export const facialHints = {
  facialType: "Horizontal en la mayor anchura cigomática; vertical por el punto más inferior del mentón y el punto medio entre las cejas.",
  convexity: "Ángulo glabela–subnasal–pogonion. Normal: 140,2° ± 4,9° (masculino) · 138,9° ± 6,2° (femenino).",
  facialThirds: "Relación tercio medio / inferior (glabela–subnasal y subnasal–mentoniano blando): 1 ± 0,08. Si no presenta, describir qué tercio está aumentado o disminuido.",
  lipSeal: "Con labios relajados hay 1 a 3 mm entre el borde inferior del labio superior y el superior del inferior.",
  lipRelation: "Línea Sn–Pg'. Labio superior adelante: 3,5 ± 1,4 mm · labio inferior adelante: 2,2 ± 1,6 mm.",
  restSymmetry: "Equilibrio horizontal y vertical entre ambos lados respecto a la línea vertical verdadera. Si no presenta, indicar el lado asimétrico en el texto.",
  openingSymmetry: "Las estructuras laterales deben seguir proporcionales al abrir la boca. Si no presenta, indicar el lado asimétrico en el texto.",
  nasolabial: "Base de la nariz – labio superior. Normal: 111,9° ± 8,4° (femenino) · 111,4° ± 11,7° (masculino).",
  mentolabial: "Labio inferior – proyección anterior del mentón. Normal: 124° ± 10°.",
  zygomatic: "Examen frontal y de perfil: depresión infraorbitaria. Deficiente en hipoplasia maxilar, aumentada en protrusión maxilar.",
  chinNeckLine: "Distancia de la unión mentón-cuello al mentón blando. Percepción morfológica, sin medir.",
  chinNeckAngle: "La rotación mandibular horaria exagerada lo cierra; la antihoraria lo abre.",
} as const;

// --- Paso 3: análisis funcional ---

export const breathingOptions = choices(FunctionalAnalysisBreathing, { ORAL: "Bucal", NASAL: "Nasal", MIXED: "Mixta" });
export const swallowingOptions = choices(FunctionalAnalysisSwallowing, { NORMAL: "Normal", ATYPICAL: "Atípica" });
export const lipClosureOptions = choices(FunctionalAnalysisLipClosure, { NORMAL: "Normal", CONTRACTION: "Contracción" });
export const tongueOptions = choices(FunctionalAnalysisTongueActivity, {
  NORMAL: "Normal", ANTERIOR_INTERPOSITION: "Interp. anterior", LATERAL_INTERPOSITION: "Interp. lateral",
});
export const suckingHabitOptions = choices(FunctionalAnalysisSuckingHabitTypesItem, {
  NONE: "No", FINGERS: "Dedos", TONGUE: "Lengua", LIPS: "Labios", NAIL_BITING: "Onicofagia",
});
export const frenulumOptions = choices(FunctionalAnalysisLingualFrenulum, { NORMAL: "Normal", SHORT: "Corto" });
export const bruxismOptions = choices(FunctionalAnalysisBruxism, {
  NONE: "No presenta", WITHOUT_WEAR: "Sí, sin presencia de desgastes dentarios", WITH_WEAR: "Sí, con presencia de desgastes",
});
export const HEART_TEST_NOTE = "* Examen del corazón.";

// --- Paso 4: análisis oclusal ---

export const transverseOptions = choices(OcclusalAnalysisTransverse, {
  NORMAL: "Normal",
  BILATERAL_POSTERIOR_CROSSBITE: "Mordida cruzada posterior bilateral",
  UNILATERAL_POSTERIOR_CROSSBITE: "Mordida cruzada posterior unilateral",
  BRODIE: "Brodie",
});
export const crossbiteTypeOptions = choices(OcclusalAnalysisCrossbiteType, {
  SKELETAL: "Esqueletal", DENTOALVEOLAR: "Dento-alveolar", NONE: "No presenta",
});
export const verticalOptions = choices(OcclusalAnalysisVertical, {
  NORMAL: "Normal", EDGE_TO_EDGE: "Bis a bis / borde a borde", DEEP_BITE: "Mordida profunda", OPEN_BITE: "Mordida abierta",
});
export const speeOptions = choices(OcclusalAnalysisSpeeCurve, { NORMAL: "Normal", ALTERED: "Alterada" });
export const midlineOptions = choices(MidlinePosition, {
  CENTERED: "Centrada", DEVIATED_RIGHT: "Desviada a la derecha", DEVIATED_LEFT: "Desviada a la izquierda",
});

// --- Paso 5: radiográfico ---

export const cephalometricOptions = choices(RadiographicAnalysisCephalometricAnalysesItem, {
  STEINER: "Steiner", RICKETTS: "Ricketts", MCNAMARA: "McNamara", WITS: "Wits",
});
/** El PDF pide realizar 3 análisis cefalométricos. */
export const CEPHALOMETRIC_REQUIRED = 3;

/** Etiqueta de un valor (para imprimir); vacío si no está en las opciones. */
export function labelOf(options: readonly ChoiceOption[], value: string | null | undefined): string {
  return options.find((o) => o.value === value)?.label ?? "";
}
