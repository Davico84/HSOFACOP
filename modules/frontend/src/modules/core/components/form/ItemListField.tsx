import { useState, type ReactNode } from "react";
import { Controller, useFormContext, type FieldValues, type Path } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "@/modules/core/ui/button";
import { Input } from "@/modules/core/ui/input";
import { FormField } from "./FormField";
import { fieldError, fieldId } from "./fieldError";

interface ItemListFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: ReactNode;
  /** Nombre de un ítem para los botones ("problema", "meta"). */
  itemName: string;
  maxItems: number;
  maxLength: number;
}

/**
 * Lista ordenada de textos: se agrega uno por uno, se quita o se mueve arriba/abajo. Un ítem vacío
 * no se agrega. Se guarda como array de strings en el orden mostrado.
 */
export function ItemListField<T extends FieldValues>({ name, label, itemName, maxItems, maxLength }: ItemListFieldProps<T>) {
  const { control, formState } = useFormContext<T>();
  const [draft, setDraft] = useState("");
  const id = fieldId(name);
  const error = fieldError(formState.errors, name);

  return (
    <FormField id={id} label={label} error={error}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const items: string[] = Array.isArray(field.value) ? field.value : [];
          const update = (next: string[]) => field.onChange(next);
          const move = (from: number, to: number) => {
            const next = [...items];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            update(next);
          };
          const add = () => {
            const text = draft.trim();
            if (!text || items.length >= maxItems) return;
            update([...items, text]);
            setDraft("");
          };
          return (
            <div className="flex flex-col gap-2">
              {items.length > 0 ? (
                <ol className="flex flex-col gap-1.5">
                  {items.map((item, i) => (
                    <li key={`${i}-${item}`} className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1 text-sm">
                      <span className="w-6 text-right text-muted-foreground">{i + 1}.</span>
                      <span className="flex-1 wrap-break-word">{item}</span>
                      <Button type="button" variant="ghost" size="icon" aria-label={`Subir ${itemName} ${i + 1}`}
                        disabled={i === 0} onClick={() => move(i, i - 1)}>
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" aria-label={`Bajar ${itemName} ${i + 1}`}
                        disabled={i === items.length - 1} onClick={() => move(i, i + 1)}>
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" aria-label={`Quitar ${itemName} ${i + 1}`}
                        onClick={() => update(items.filter((_, j) => j !== i))}>
                        <X className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ol>
              ) : null}
              <div className="flex gap-2">
                <Input
                  id={id}
                  value={draft}
                  maxLength={maxLength}
                  placeholder={`Nuevo ${itemName}`}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      add();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={add} disabled={!draft.trim() || items.length >= maxItems}>
                  <Plus className="size-4" /> Agregar
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                {items.length} de {maxItems}
              </span>
            </div>
          );
        }}
      />
    </FormField>
  );
}
