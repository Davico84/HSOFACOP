import { z } from "zod";

/** Motivo de la solicitud de desbloqueo (mismas reglas que el servidor: 1–200 caracteres). */
export const unlockRequestSchema = z.object({
  reason: z.string().trim().min(1, "Indica el motivo.").max(200, "El motivo admite hasta 200 caracteres."),
});

export type UnlockRequestValues = z.infer<typeof unlockRequestSchema>;
