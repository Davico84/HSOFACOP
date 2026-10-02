import { useFormContext, useWatch } from "react-hook-form";
import type { RecordFormValues } from "../../schemas/record";
import { CROWDING_ROWS } from "../../config/moyers";
import { moyersResult } from "../../utils/moyers";

/** Tabla 2 de la ficha de Moyers: arcada/lado según el signo de su diferencia (solo lectura). */
export function CrowdingPredisposition() {
  const { control } = useFormContext<RecordFormValues>();
  const [incisors, available] = useWatch({
    control,
    name: ["content.models.moyers.lowerIncisors", "content.models.moyers.availableSpace"],
  });
  const { crowding } = moyersResult(incisors, available);

  return (
    <div className="flex flex-col gap-1.5">
      <table className="w-full max-w-xl border-collapse text-sm">
        <caption className="mb-1.5 text-left text-sm font-medium">Predisposición de apiñamiento dental</caption>
        <tbody>
          {CROWDING_ROWS.map(({ key, label }) => (
            <tr key={key} className="border-t border-border">
              <th scope="row" className="w-28 py-1.5 pr-3 text-left font-medium">{label}</th>
              <td className="py-1.5">{crowding[key].join(" · ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground">
        Según el signo de la diferencia: Positivo sobra espacio, Nulo justo, Negativo falta espacio.
      </p>
    </div>
  );
}
