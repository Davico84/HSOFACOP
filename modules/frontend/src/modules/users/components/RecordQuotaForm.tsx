import { useState, type FormEvent } from "react";
import { Button } from "@/modules/core/ui/button";
import { NumberInput } from "@/modules/core/ui/number-input";
import { FieldHint } from "@/modules/core/components/form/FieldHint";
import { DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/modules/core/ui/dialog";
import { buttonVariants } from "@/modules/core/ui/button-variants";
import type { UserSummaryResponse } from "@/modules/core/services/generated/model";
import { MAX_RECORD_QUOTA } from "../utils/quota";
import type { RecordQuotaDialogProps } from "./RecordQuotaDialog";

/** Contenido del diálogo de cupo: número (0–9999) o "Sin límite", con aviso si queda por debajo de lo creado. */
export function RecordQuotaForm({ user, onConfirm }: { user: UserSummaryResponse; onConfirm: RecordQuotaDialogProps["onConfirm"] }) {
  const [unlimited, setUnlimited] = useState(user.recordQuota == null);
  const [quota, setQuota] = useState<number | null>(user.recordQuota ?? user.recordCount);

  const valid = unlimited || (quota != null && Number.isInteger(quota) && quota >= 0 && quota <= MAX_RECORD_QUOTA);
  const below = !unlimited && quota != null && quota < user.recordCount;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (valid) onConfirm(user, unlimited ? null : quota);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Cupo de historias de {user.fullName}</DialogTitle>
        <DialogDescription>
          Ha creado {user.recordCount} {user.recordCount === 1 ? "historia" : "historias"}. Al llegar al cupo no podrá crear más,
          pero sí editar e imprimir las que tiene.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <label htmlFor="record-quota" className="text-sm font-medium">
          Máximo de historias
        </label>
        <NumberInput
          id="record-quota"
          className="max-w-40"
          min={0}
          max={MAX_RECORD_QUOTA}
          step={1}
          inputMode="numeric"
          value={unlimited ? null : quota}
          onChange={setQuota}
          disabled={unlimited}
          aria-invalid={!valid}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-primary" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} />
          Sin límite
        </label>
        {!valid ? (
          <p className="text-sm text-destructive" role="alert">
            Ingresa un número entero entre 0 y {MAX_RECORD_QUOTA}.
          </p>
        ) : null}
        {below ? (
          <FieldHint>
            Ya tiene {user.recordCount} {user.recordCount === 1 ? "historia" : "historias"}: no podrá crear más. Las existentes no se tocan.
          </FieldHint>
        ) : null}
      </div>
      <DialogFooter>
        <DialogClose className={buttonVariants({ variant: "outline" })}>Cancelar</DialogClose>
        <Button type="submit" disabled={!valid}>
          Guardar
        </Button>
      </DialogFooter>
    </form>
  );
}
