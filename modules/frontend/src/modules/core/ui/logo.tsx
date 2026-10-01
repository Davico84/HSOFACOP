import type { ImgHTMLAttributes } from "react";
import { cn } from "@/modules/core/utils/cn";
import { project } from "@/config/project";

interface LogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  /** `auto` (por tema) o `white` (silueta blanca, para fondos de color/gradiente). */
  variant?: "auto" | "white";
}

/**
 * Logo del proyecto: rutas y texto alternativo desde project.config.json.
 * `auto` muestra la variante clara u oscura según el tema.
 */
export function Logo({ className, variant = "auto", ...props }: LogoProps) {
  const { logo } = project.brand;
  if (variant === "white") {
    return <img src={logo.white} alt={project.name} className={className} {...props} />;
  }
  return (
    <>
      <img src={logo.light} alt={project.name} className={cn("dark:hidden", className)} {...props} />
      <img src={logo.dark} alt={project.name} className={cn("hidden dark:block", className)} {...props} />
    </>
  );
}
