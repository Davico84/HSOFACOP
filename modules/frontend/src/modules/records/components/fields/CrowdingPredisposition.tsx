import { FieldHint } from "@/modules/core/components/form/FieldHint";
import { TextField } from "@/modules/core/components/form/TextField";
import { SHORT_TEXT } from "../../schemas/record";
import { CROWDING_ROWS } from "../../config/moyers";

/**
 * Tabla 2 de la ficha de Moyers: el odontólogo escribe qué arcada/lado corresponde a cada fila,
 * guiándose por las diferencias calculadas (revisión del usuario: no se completa sola).
 */
export function CrowdingPredisposition() {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium">Predisposición de apiñamiento dental</legend>
      <div className="grid gap-4 sm:grid-cols-3">
        {CROWDING_ROWS.map(({ key, label }) => (
          <TextField key={key} name={`content.models.moyers.${key}`} label={label} maxLength={SHORT_TEXT} />
        ))}
      </div>
      <FieldHint>
        Guíate por la diferencia de cada lado: positiva sobra espacio, cero es justo, negativa falta espacio.
      </FieldHint>
    </fieldset>
  );
}
