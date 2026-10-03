import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/modules/core/ui/input";
import { fieldError, fieldId } from "@/modules/core/components/form/fieldError";
import type { RecordFormValues } from "../../schemas/record";
import { angleClassOptions, sideOptions } from "../../config/options";

type RelationsName =
  | "content.occlusal.canineRelation"
  | "content.occlusal.molarRelation"
  | "content.occlusal.canineRelationMi"
  | "content.occlusal.canineRelationMih";

interface RelationsFieldProps {
  name: RelationsName;
  label: string;
}

/**
 * Relación canina o molar por lado: clase de Angle (una por fila; pulsar la marcada la quita) y un
 * detalle libre para la fracción ("½ cúspide").
 */
export function RelationsField({ name, label }: RelationsFieldProps) {
  const { register, formState, setValue, control } = useFormContext<RecordFormValues>();
  const relations = useWatch({ control, name });
  const sides = sideOptions.map((s) => ({ ...s, key: s.value === "RIGHT" ? ("right" as const) : ("left" as const) }));

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="py-1 pr-3 text-left font-medium" scope="col">Lado</th>
              {angleClassOptions.map((o) => (
                <th key={o.value} className="px-2 py-1 text-center font-medium" scope="col">{o.label}</th>
              ))}
              <th className="px-2 py-1 text-left font-medium" scope="col">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {sides.map((side) => {
              const classPath = `${name}.${side.key}.angleClass` as const;
              const detailPath = `${name}.${side.key}.detail` as const;
              const current = relations?.[side.key]?.angleClass;
              const detailError = fieldError(formState.errors, detailPath);
              return (
                <tr key={side.key} className="border-t border-border" role="radiogroup" aria-label={`${label}, lado ${side.label}`}>
                  <th scope="row" className="py-1.5 pr-3 text-left font-medium">{side.label}</th>
                  {angleClassOptions.map((o) => {
                    const checked = current === o.value;
                    return (
                      <td key={o.value} className="px-2 py-1.5 text-center">
                        <input
                          type="radio"
                          name={fieldId(classPath)}
                          aria-label={`${label}, lado ${side.label}: ${o.label}`}
                          checked={checked}
                          onChange={() => undefined}
                          onClick={() => setValue(classPath, checked ? null : o.value, { shouldDirty: true })}
                          className="accent-primary"
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5">
                    <Input
                      aria-label={`${label}, lado ${side.label}: detalle`}
                      placeholder="p. ej. ½ cúspide"
                      className="h-8 min-w-32"
                      aria-invalid={detailError ? true : undefined}
                      {...register(detailPath)}
                    />
                    {detailError ? <p className="text-xs text-destructive">{detailError}</p> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </fieldset>
  );
}
