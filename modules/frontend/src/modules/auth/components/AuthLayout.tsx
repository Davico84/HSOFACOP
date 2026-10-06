import type { ReactNode } from "react";
import { ThemeToggle } from "@/modules/core/ui/theme-toggle";
import { Logo } from "@/modules/core/ui/logo";
import { BrandPanel } from "@/modules/core/components/BrandPanel";
import { ContactLinks } from "@/modules/core/components/ContactLinks";

interface AuthLayoutProps {
  title: string;
  /** Subtítulo del formulario (no confundir con `project.description`, la frase de producto). */
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Marco split-screen de las pantallas de auth: panel de marca (`BrandPanel`, token
 * brand-start), logo en blanco, tagline y descripción de
 * project.config.json a un lado, y el formulario al otro. En móvil colapsa a
 * una sola columna con el logo (a color) arriba.
 */
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />

      {/* Panel del formulario */}
      <main className="relative flex items-center justify-center px-6 py-10">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo className="h-12 w-auto" />
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {children}
          {footer ? <div className="mt-6 text-center">{footer}</div> : null}
          {/* En escritorio el contacto está en el panel de marca; aquí solo en móvil, sin repetirse. */}
          <ContactLinks className="mt-10 flex flex-col items-center border-t border-border pt-6 text-center lg:hidden" />
        </div>
      </main>
    </div>
  );
}
