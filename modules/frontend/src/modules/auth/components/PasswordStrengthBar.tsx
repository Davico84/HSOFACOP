import { cn } from "@/modules/core/utils/cn";
import { getPasswordStrength } from "../hooks/usePasswordStrength";

interface PasswordStrengthBarProps {
  /** Valor actual del campo de contraseña (obtenido con `useWatch`). */
  password: string;
}

/**
 * Barra visual de 4 segmentos que indica la fuerza de la contraseña.
 * Se oculta cuando el campo está vacío.
 */
export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const strength = getPasswordStrength(password);
  if (strength.level === 0) return null;

  // Separamos las clases de color: bg-* para los segmentos, text-* para el label
  const [bgClass, textClass] = strength.colorClass.split(" ");

  return (
    <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex gap-1">
        {([1, 2, 3, 4] as const).map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i <= strength.level ? bgClass : "bg-border",
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs font-medium", textClass)}>{strength.label}</p>
    </div>
  );
}
