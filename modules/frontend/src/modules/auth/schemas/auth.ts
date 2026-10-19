import { z } from "zod";
import { checkContact, contactFields } from "@/modules/users/schemas/contact";

/**
 * Schemas Zod de los formularios de auth. En paridad de **formato** con las
 * restricciones Bean Validation del backend (ver docs/coding-style.md §7).
 */
export const loginSchema = z.object({
  email: z.string().min(1, "El correo es obligatorio").email("Correo electrónico no válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

/** Registro: obligatorios nombre, correo y contraseña; opcionales el código de turma y los datos del alumno. */
export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Ingresa tu nombre completo").max(120),
    email: z.string().min(1, "El correo es obligatorio").email("Correo electrónico no válido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
    cohortCode: z.string().trim().max(20, "El código de turma no es válido."),
    ...contactFields,
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Las contraseñas no coinciden" });
    }
    checkContact(data, ctx);
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
