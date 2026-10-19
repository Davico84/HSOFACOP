import { Controller, useFormContext } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/modules/core/ui/select";
import { TextField } from "@/modules/core/components/form/TextField";
import { FormField } from "@/modules/core/components/form/FormField";
import { describedBy, fieldError, fieldId } from "@/modules/core/components/form/fieldError";
import { documentTypeOptions } from "@/modules/records/config/options";
import type { ContactValues } from "../schemas/contact";

const NONE = "none";

/**
 * Celular, documento (tipo y número) y COP de una cuenta, dentro de un `FormProvider` cuyo schema
 * incluye `contactFields` (registro y "Mis datos"). Solo pinta: las reglas están en el schema.
 */
export function ContactFieldsInputs() {
  const { control, formState } = useFormContext<ContactValues>();
  const typeId = fieldId("documentType");
  const typeError = fieldError(formState.errors, "documentType");
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField<ContactValues>
        name="phone"
        label="Celular"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={9}
        placeholder="987654321"
        className="sm:col-span-2"
      />
      <FormField id={typeId} label="Tipo de documento" error={typeError}>
        <Controller
          control={control}
          name="documentType"
          render={({ field }) => (
            <Select value={field.value || NONE} onValueChange={(next) => field.onChange(next === NONE ? "" : next)}>
              <SelectTrigger
                id={typeId}
                className="w-full"
                aria-invalid={typeError ? true : undefined}
                aria-describedby={describedBy(typeId, undefined, typeError)}
                onBlur={field.onBlur}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin documento</SelectItem>
                {documentTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
      <TextField<ContactValues> name="documentNumber" label="Número de documento" inputMode="numeric" maxLength={12} />
      <TextField<ContactValues>
        name="copNumber"
        label="COP (colegiatura)"
        hint="Si ya eres odontólogo colegiado."
        inputMode="numeric"
        maxLength={6}
        className="sm:col-span-2"
      />
    </div>
  );
}
