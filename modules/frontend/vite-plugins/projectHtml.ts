import { readFileSync } from "node:fs";
import type { Plugin } from "vite";

/** Campos de project.config.json que usa el index.html. */
interface HtmlProjectConfig {
  name: string;
  brand: { favicon: string };
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const FAVICON_TYPES: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  ico: "image/x-icon",
  webp: "image/webp",
};

/** MIME del favicon según su extensión (el `type` del <link> debe coincidir con el archivo). */
export function faviconType(favicon: string): string {
  const ext = favicon.split(".").pop()?.toLowerCase() ?? "";
  return FAVICON_TYPES[ext] ?? "image/x-icon";
}

/** Sustituye los marcadores del index.html por la identidad del proyecto. */
export function renderProjectHtml(html: string, config: HtmlProjectConfig): string {
  return html
    .replaceAll("%PROJECT_NAME%", escapeHtml(config.name))
    .replaceAll("%PROJECT_FAVICON_TYPE%", faviconType(config.brand.favicon))
    .replaceAll("%PROJECT_FAVICON%", escapeHtml(config.brand.favicon));
}

/**
 * Plugin de Vite: título y favicon del index.html desde project.config.json.
 * Lee el archivo en cada transformación (dev y build), así un cambio en la
 * config se ve al recargar sin reiniciar el servidor.
 */
export function projectHtmlPlugin(configPath: string): Plugin {
  return {
    name: "project-html",
    transformIndexHtml(html) {
      const config = JSON.parse(readFileSync(configPath, "utf8")) as HtmlProjectConfig;
      return renderProjectHtml(html, config);
    },
  };
}
