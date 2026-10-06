import config from "@project-config";

/** Tokens de marca configurables (ver bloque @template:brand de globals.css). */
type BrandPalette = Partial<Record<"primary" | "ring" | "brand-start" | "brand-end", string>>;

/** WhatsApp (solo dígitos con código de país) y/o correo de soporte. */
export interface SupportContact {
  whatsapp?: string;
  email?: string;
}

/** Identidad visible del proyecto (project.config.json, raíz del repo). */
export interface ProjectConfig {
  name: string;
  tagline: string;
  description: string;
  database: { name: string; user: string; port: number; container: string };
  jwtIssuer: string;
  /** Contacto de soporte opcional (login, registro y espera larga). Queda público en la web. */
  contact?: SupportContact;
  brand: {
    logo: { light: string; dark: string; white: string };
    favicon: string;
    colors: { light: BrandPalette; dark: BrandPalette };
  };
}

/**
 * Única fuente de la marca en la UI. Se cambia con `pnpm project:setup` o
 * editando project.config.json; nunca copies estos textos en componentes.
 */
export const project: ProjectConfig = config;
