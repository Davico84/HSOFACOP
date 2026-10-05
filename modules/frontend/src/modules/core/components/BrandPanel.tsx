import { Logo } from "@/modules/core/ui/logo";
import { project } from "@/config/project";

/**
 * Panel de marca de las pantallas a pantalla completa (login, registro, arranque en frío): Roxo
 * liso (token brand-start) con el logo en blanco, tagline y descripción de project.config.json,
 * como las piezas del manual de FACOP. Solo en escritorio; en móvil cada pantalla pone el logo.
 */
export function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between bg-brand-start p-12 text-white lg:flex">
      <Logo variant="white" className="h-12 w-auto self-start" />
      <div className="max-w-md">
        <h2 className="text-balance text-3xl font-semibold leading-tight">{project.tagline}</h2>
        <p className="mt-3 text-white/80">{project.description}</p>
      </div>
      <p className="text-sm text-white/70">© {project.name}</p>
    </aside>
  );
}
