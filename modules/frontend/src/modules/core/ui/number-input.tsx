import type { InputHTMLAttributes, Ref } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/modules/core/utils/cn";
import { Input } from "./input";

export interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "min" | "max" | "step"> {
  value: number | null | undefined;
  /** Vacío = `null`. */
  onChange: (value: number | null) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Clases del contenedor (ancho, márgenes). */
  className?: string;
  /** Clases del `<input>` (alto, alineación del texto). */
  inputClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

/** Decimales del paso (0,1 → 1), para que sumar no deje restos de coma flotante (0,30000000000000004). */
function decimalsOf(step: number): number {
  const [, fraction = ""] = String(step).split(".");
  return fraction.length;
}

/**
 * Número con botones propios para subir y bajar: las flechas nativas del navegador se ocultan
 * porque no siguen el tema (en modo oscuro casi no se ven). Los botones usan los tokens del tema y
 * no reciben foco con Tab: con el teclado se usan ↑/↓ del propio campo.
 */
export function NumberInput({
  value,
  onChange,
  step = 1,
  min,
  max,
  className,
  inputClassName,
  disabled,
  ref,
  ...props
}: NumberInputProps) {
  const decimals = decimalsOf(step);

  function nudge(direction: 1 | -1) {
    const base = value ?? min ?? 0;
    let next = Number((base + direction * step).toFixed(decimals));
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChange(next);
  }

  const button =
    "flex flex-1 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50";

  return (
    <div className={cn("relative", className)}>
      <Input
        ref={ref}
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        className={cn(
          "pr-7 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          inputClassName,
        )}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        {...props}
      />
      <div className="absolute inset-y-px right-px flex w-6 flex-col overflow-hidden rounded-r-md border-l border-input">
        {/* onMouseDown evita que el campo pierda el foco al pulsar. */}
        <button
          type="button"
          tabIndex={-1}
          aria-label="Aumentar"
          disabled={disabled}
          className={button}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => nudge(1)}
        >
          <ChevronUp className="size-3" aria-hidden="true" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Disminuir"
          disabled={disabled}
          className={cn(button, "border-t border-input")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => nudge(-1)}
        >
          <ChevronDown className="size-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
