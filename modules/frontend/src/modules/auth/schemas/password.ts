import { z } from "zod";

/** Mínimo de la contraseña (igual que el registro y el backend). */
const MIN = 8;
const newPassword = z.string().min(MIN, "La contraseña debe tener al menos 8 caracteres");

/** Cambio de contraseña en "Mis datos" (paridad con `ChangePasswordRequest`; distinta de la actual). */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Escribe tu contraseña actual"),
    newPassword,
    confirmPassword: z.string().min(1, "Confirma la nueva contraseña"),
  })
  .superRefine((v, ctx) => {
    if (v.newPassword && v.newPassword === v.currentPassword) {
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: "La nueva contraseña debe ser distinta de la actual." });
    }
    if (v.confirmPassword && v.newPassword !== v.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Las contraseñas no coinciden" });
    }
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

/** Nueva contraseña con un enlace de restablecimiento (paridad con `ResetPasswordRequest`). */
export const resetPasswordSchema = z
  .object({
    newPassword,
    confirmPassword: z.string().min(1, "Confirma la nueva contraseña"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

/** `type` de los rechazos del cambio que van a un campo, y a cuál. */
export const CHANGE_PASSWORD_FIELD_ERRORS: Record<string, keyof ChangePasswordValues> = {
  "/errors/wrong-current-password": "currentPassword",
  "/errors/password-change-locked": "currentPassword",
  "/errors/same-password": "newPassword",
};

/** `type` del enlace de restablecimiento no válido (usado, vencido, anulado o inexistente). */
export const INVALID_PASSWORD_RESET_TYPE = "/errors/invalid-password-reset";
