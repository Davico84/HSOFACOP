import { ClipboardList } from "lucide-react";
import { Card } from "@/modules/core/ui/card";
import { NewRecordLink } from "@/modules/records/components/NewRecordLink";

/** Tratante sin historias todavía: invitación a crear la primera (respeta el cupo). */
export function DashboardEmpty() {
  return (
    <Card className="flex flex-col items-center gap-3 p-8 text-center">
      <ClipboardList className="size-8 text-muted-foreground" aria-hidden="true" />
      <div>
        <p className="font-medium">Todavía no tienes historias clínicas</p>
        <p className="text-sm text-muted-foreground">Crea la primera: aquí verás tu avance, lo que falta y qué retomar.</p>
      </div>
      <NewRecordLink />
    </Card>
  );
}
