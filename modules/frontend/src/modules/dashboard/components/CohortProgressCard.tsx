import { Card } from "@/modules/core/ui/card";
import { MeterBar } from "@/modules/core/components/MeterBar";
import type { CoordinatorCohortProgress } from "@/modules/core/services/generated/model";
import { historias } from "../utils/format";

interface CohortProgressCardProps {
  cohort: CoordinatorCohortProgress;
}

const alumnos = (n: number) => `${n} ${n === 1 ? "alumno" : "alumnos"}`;

/** Avance de una turma: resumen de sus historias y cada alumno con sus historias y cuántas completas. */
export function CohortProgressCard({ cohort }: CohortProgressCardProps) {
  const titleId = `cohort-${cohort.id}-title`;
  const max = Math.max(...cohort.studentList.map((s) => s.records), 1);
  return (
    <Card className="flex flex-col gap-4 p-5" aria-labelledby={titleId} role="region">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={titleId} className="font-semibold">
          {cohort.name}
        </h2>
        <p className="text-sm text-muted-foreground">{alumnos(cohort.students)}</p>
      </div>
      {cohort.students === 0 ? (
        <p className="text-sm text-muted-foreground">Esta turma aún no tiene alumnos.</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {(
              [
                ["Historias", cohort.records],
                ["Completas", cohort.complete],
                ["En progreso", cohort.inProgress],
                ["Sin historias", cohort.studentsWithoutRecords],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex flex-col rounded-md bg-muted px-3 py-2">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-lg font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          {cohort.notComputed > 0 ? (
            <p className="text-sm text-muted-foreground">
              {historias(cohort.notComputed)} sin calcular: se calculan cuando su autor las vuelve a guardar.
            </p>
          ) : null}
          <ul className="flex flex-col gap-3" aria-label={`Alumnos de ${cohort.name}`}>
            {cohort.studentList.map((student) => (
              <li key={student.id}>
                <MeterBar
                  label={student.fullName}
                  value={student.records}
                  max={max}
                  valueText={
                    student.records === 0 ? "Sin historias" : `${historias(student.records)} · ${student.complete} completas`
                  }
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
