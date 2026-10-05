import { Link } from "react-router-dom";
import { buttonVariants } from "@/modules/core/ui/button-variants";
import { useRecordsListUrl } from "../hooks/useRecordsListUrl";

/** Historia inexistente o fuera del alcance del usuario (404): no se revela si existe. */
export function RecordNotFound() {
  const listUrl = useRecordsListUrl();
  return (
    <section role="alert" className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <h1 className="text-2xl font-bold text-foreground">Historia no encontrada</h1>
      <p className="max-w-sm text-muted-foreground">La historia clínica no existe o no tienes acceso a ella.</p>
      <Link to={listUrl} className={buttonVariants()}>
        Volver a las historias
      </Link>
    </section>
  );
}
