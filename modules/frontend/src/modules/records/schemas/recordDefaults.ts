import type { z } from "zod";
import { recordFormSchema, type RecordFormValues } from "./record";

/** Lo que se necesita leer de la definición interna de un schema de Zod 4. */
interface SchemaDef {
  type: string;
  innerType?: z.ZodType;
  shape?: Record<string, z.ZodType>;
}

function defOf(schema: z.ZodType): SchemaDef {
  return (schema as unknown as { _zod: { def: SchemaDef } })._zod.def;
}

/**
 * Valor "vacío" de cada campo según su tipo en el schema: texto `""`, opción/número/casilla
 * `null`, lista `[]` y objetos con todos sus campos. Así todos los campos existen desde el inicio
 * y montarlos no cuenta como un cambio (react-hook-form compara contra los valores iniciales).
 */
function blank(schema: z.ZodType): unknown {
  const def = defOf(schema);
  switch (def.type) {
    case "optional":
    case "nullable":
      return blank(def.innerType as z.ZodType);
    case "object":
      return Object.fromEntries(Object.entries(def.shape ?? {}).map(([key, field]) => [key, blank(field)]));
    case "array":
      return [];
    case "string":
      return "";
    default:
      return null;
  }
}

/** Mezcla profunda: lo que trae `value` (salvo `null`/`undefined`) gana a `base`. */
function merge(base: unknown, value: unknown): unknown {
  if (value === null || value === undefined) return base;
  if (base && typeof base === "object" && !Array.isArray(base) && typeof value === "object" && !Array.isArray(value)) {
    const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      result[key] = merge(result[key], v);
    }
    return result;
  }
  return value;
}

const BLANK = blank(recordFormSchema);

/** Valores del formulario con todos los campos presentes (vacíos donde `values` no trae nada). */
export function completeValues(values: unknown): RecordFormValues {
  return merge(BLANK, values) as RecordFormValues;
}
