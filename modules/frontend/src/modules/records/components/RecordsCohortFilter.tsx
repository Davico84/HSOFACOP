import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/modules/core/ui/select";
import { useCohorts } from "@/modules/cohorts/hooks/useCohorts";

const ALL = "all";

interface RecordsCohortFilterProps {
  /** Turma elegida; `null` = todas las de la coordinación. */
  value: number | null;
  onChange: (cohortId: number | null) => void;
}

/** Filtro del listado por una de las turmas de la coordinación (el servidor solo devuelve las suyas). */
export function RecordsCohortFilter({ value, onChange }: RecordsCohortFilterProps) {
  const cohorts = useCohorts();
  const options = cohorts.data ?? [];
  return (
    <Select
      value={value == null ? ALL : String(value)}
      onValueChange={(next) => onChange(next === ALL ? null : Number(next))}
    >
      <SelectTrigger aria-label="Filtrar por turma" className="w-full sm:w-56">
        <SelectValue placeholder="Todas las turmas" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>Todas las turmas</SelectItem>
        {options.map((cohort) => (
          <SelectItem key={cohort.id} value={String(cohort.id)}>
            {cohort.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
