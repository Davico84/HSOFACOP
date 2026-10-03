import type { ComponentProps, ReactNode } from "react";
import { useFormContext, type FieldValues, type Path } from "react-hook-form";
import { Input } from "@/modules/core/ui/input";
import { FormField } from "./FormField";
import { describedBy, fieldError, fieldId } from "./fieldError";

interface TextFieldProps<T extends FieldValues> extends Omit<ComponentProps<"input">, "name"> {
  name: Path<T>;
  label: ReactNode;
  hint?: ReactNode;
}

/** Campo de texto de una línea (también fecha, con `type="date"`) dentro de un `FormProvider`. */
export function TextField<T extends FieldValues>({ name, label, hint, className, ...props }: TextFieldProps<T>) {
  const { register, formState } = useFormContext<T>();
  const id = fieldId(name);
  const error = fieldError(formState.errors, name);
  return (
    <FormField id={id} label={label} hint={hint} error={error} className={className}>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
        {...register(name)}
      />
    </FormField>
  );
}
