import { Loader2 } from "lucide-react";
import { Button } from "@/modules/core/ui/button";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";
import { useMyProfile } from "../hooks/useMyProfile";
import { ProfileForm } from "./ProfileForm";

/** "Mis datos" (todos los roles): carga los datos de la cuenta y muestra carga, error o el formulario. */
export function ProfileFeature() {
  const profile = useMyProfile();

  let content;
  if (profile.isPending) {
    content = (
      <p className="flex items-center gap-2 text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando tus datos…
      </p>
    );
  } else if (profile.isError) {
    content = (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-destructive">{getUserFriendlyError(profile.error)}</p>
        <Button variant="outline" size="sm" onClick={() => void profile.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  } else {
    content = <ProfileForm profile={profile.data} />;
  }

  return (
    <section aria-labelledby="profile-title" className="flex flex-col gap-6">
      <header>
        <h1 id="profile-title" className="text-2xl font-bold">
          Mis datos
        </h1>
        <p className="text-muted-foreground">Tu celular, tu documento y tu colegiatura.</p>
      </header>
      {content}
    </section>
  );
}
