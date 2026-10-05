import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/modules/core/ui/button";
import { buttonVariants } from "@/modules/core/ui/button-variants";
import { Textarea } from "@/modules/core/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/core/ui/dialog";
import { unlockRequestSchema, type UnlockRequestValues } from "../schemas/unlockRequest";

interface RequestUnlockDialogProps {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
}

/** El tratante pide al ADMIN desbloquear los datos del paciente, con un motivo (1–200 caracteres). */
export function RequestUnlockDialog({ open, pending, onOpenChange, onSubmit }: RequestUnlockDialogProps) {
  const form = useForm<UnlockRequestValues>({
    resolver: zodResolver(unlockRequestSchema),
    mode: "onTouched",
    defaultValues: { reason: "" },
  });
  const error = form.formState.errors.reason?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form noValidate onSubmit={form.handleSubmit((values) => onSubmit(values.reason))} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Solicitar desbloqueo</DialogTitle>
            <DialogDescription>
              El administrador revisará la solicitud. Indica qué dato hay que corregir y por qué.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <label htmlFor="unlock-reason" className="text-sm font-medium">
              Motivo
            </label>
            <Textarea
              id="unlock-reason"
              maxLength={200}
              placeholder="Ej.: error en el número de DNI"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "unlock-reason-error" : undefined}
              {...form.register("reason")}
            />
            {error ? (
              <p id="unlock-reason-error" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose className={buttonVariants({ variant: "outline" })}>Cancelar</DialogClose>
            <Button type="submit" disabled={pending}>
              Enviar solicitud
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
