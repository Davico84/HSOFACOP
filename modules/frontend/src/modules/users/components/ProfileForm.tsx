import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/modules/core/ui/button";
import { roleLabel } from "@/modules/core/auth/roleLabel";
import type { ProfileResponse } from "@/modules/core/services/generated/model";
import { applyServerFieldErrors, getUserFriendlyError } from "@/modules/core/utils/apiError";
import { useUpdateMyProfile } from "../hooks/useMyProfile";
import { contactPayload, contactSchema, contactValues, type ContactValues } from "../schemas/contact";
import { ContactFieldsInputs } from "./ContactFieldsInputs";

/** "Mis datos": nombre, correo y rol de solo lectura y el formulario de celular, documento y COP. */
export function ProfileForm({ profile }: { profile: ProfileResponse }) {
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: contactValues(profile),
  });
  const update = useUpdateMyProfile();

  const submit = form.handleSubmit((values) =>
    update.mutate(contactPayload(values), {
      onSuccess: (saved) => form.reset(contactValues(saved)),
      onError: (error) => {
        if (applyServerFieldErrors(error, form.setError) === 0) toast.error(getUserFriendlyError(error));
      },
    }),
  );

  const identity: [string, string][] = [
    ["Nombre", profile.fullName],
    ["Correo", profile.email],
    ["Rol", roleLabel(profile.role)],
  ];

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <dl className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-3">
        {identity.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-medium wrap-break-word">{value}</dd>
          </div>
        ))}
      </dl>
      <FormProvider {...form}>
        <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
          <div>
            <h2 className="font-semibold">Contacto e identificación</h2>
            <p className="text-sm text-muted-foreground">Todos opcionales. Solo los ves tú y el administrador.</p>
          </div>
          <ContactFieldsInputs />
          <div className="flex justify-end">
            <Button type="submit" disabled={update.isPending || !form.formState.isDirty}>
              {update.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Guardar
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
