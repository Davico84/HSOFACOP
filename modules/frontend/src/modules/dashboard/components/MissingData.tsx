import { Card } from "@/modules/core/ui/card";
import { MeterBar } from "@/modules/core/components/MeterBar";
import type { UserDashboardMissing } from "@/modules/core/services/generated/model";
import { RECORD_STEPS } from "@/modules/records/config/recordSteps";
import { historias } from "../utils/format";

interface MissingDataProps {
  missing: UserDashboardMissing;
  /** Historias con pasos calculados (base de las barras de pasos vacíos). */
  computed: number;
}

/** Datos del paciente que faltan y pasos clínicos que más se dejan vacíos. */
export function MissingData({ missing, computed }: MissingDataProps) {
  const patient = [
    { label: "Sin documento", value: missing.withoutDocument },
    { label: "Sin fecha de nacimiento", value: missing.withoutBirthDate },
    { label: "Sin fecha de inicio de tratamiento", value: missing.withoutTreatmentStart },
  ];
  return (
    <Card className="flex flex-col gap-5 p-5">
      <h2 className="font-semibold">Datos faltantes</h2>
      <ul className="grid gap-2 text-sm sm:grid-cols-3">
        {patient.map((item) => (
          <li key={item.label} className="flex items-baseline justify-between gap-2 rounded-md bg-muted px-3 py-2">
            <span>{item.label}</span>
            <span className="font-semibold tabular-nums">{item.value}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-muted-foreground">Pasos vacíos (de {historias(computed)} calculadas)</h3>
        <ol className="flex flex-col gap-3">
          {missing.emptySteps.map((item) => {
            const step = RECORD_STEPS[item.step - 1];
            return (
              <li key={item.step}>
                <MeterBar
                  label={`${item.step}. ${step?.title ?? ""}`}
                  value={item.count}
                  max={computed}
                  valueText={historias(item.count)}
                />
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}
