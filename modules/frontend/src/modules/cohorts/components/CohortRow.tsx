import { Copy, Lock, LockOpen, Pencil, RefreshCw } from "lucide-react";
import { Badge } from "@/modules/core/ui/badge";
import { IconAction } from "@/modules/core/components/IconAction";
import { copyToClipboard } from "@/modules/core/utils/clipboard";
import type { CohortResponse } from "@/modules/core/services/generated/model";
import { formatCohortCode } from "../utils/cohortCode";

interface CohortRowProps {
  cohort: CohortResponse;
  /** Cambio de inscripción o de código en curso para esta turma. */
  pending: boolean;
  onRename: (cohort: CohortResponse) => void;
  onRegenerate: (cohort: CohortResponse) => void;
  onToggleRegistration: (cohort: CohortResponse) => void;
}

const count = (n: number | null | undefined, one: string, many: string) => `${n ?? 0} ${(n ?? 0) === 1 ? one : many}`;

/** Turma en el diálogo de gestión: nombre, conteos, código de inscripción con su estado y acciones. */
export function CohortRow({ cohort, pending, onRename, onRegenerate, onToggleRegistration }: CohortRowProps) {
  const code = cohort.registrationCode ? formatCohortCode(cohort.registrationCode) : "";
  const open = cohort.registrationOpen ?? false;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
      <div className="min-w-0">
        <p className="font-medium wrap-break-word">{cohort.name}</p>
        <p className="text-xs text-muted-foreground">
          {count(cohort.students, "alumno", "alumnos")} · {count(cohort.coordinators, "coordinación", "coordinaciones")}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-sm font-semibold tracking-wider" aria-label={`Código ${code}`}>
            {code}
          </span>
          <Badge variant="outline" className={open ? "border-success/30 bg-success/10" : "text-muted-foreground"}>
            {open ? "Inscripción abierta" : "Cerrada"}
          </Badge>
        </div>
      </div>
      <div className="flex gap-0.5">
        <IconAction icon={Copy} label="Copiar código" ariaLabel={`Copiar el código de ${cohort.name}`} onClick={() => void copyToClipboard(code, "Código copiado")} />
        <IconAction
          icon={RefreshCw}
          label="Código nuevo"
          ariaLabel={`Generar un código nuevo para ${cohort.name}`}
          disabled={pending}
          onClick={() => onRegenerate(cohort)}
        />
        <IconAction
          icon={open ? Lock : LockOpen}
          label={open ? "Cerrar inscripción" : "Abrir inscripción"}
          ariaLabel={`${open ? "Cerrar" : "Abrir"} la inscripción de ${cohort.name}`}
          loading={pending}
          onClick={() => onToggleRegistration(cohort)}
        />
        <IconAction icon={Pencil} label="Renombrar" ariaLabel={`Renombrar la turma ${cohort.name}`} onClick={() => onRename(cohort)} />
      </div>
    </li>
  );
}
