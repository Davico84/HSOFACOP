import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { projectHtmlPlugin } from "./vite-plugins/projectHtml";

// Identidad del proyecto (nombre, logos, colores…): ../../project.config.json.
// El manejo de SSL se añadirá cuando una capacidad lo requiera.
const repoRoot = path.resolve(__dirname, "../..");
const projectConfigPath = path.join(repoRoot, "project.config.json");

export default defineConfig(({ mode }) => {
  // Carga variables de .env / .env.<mode> (ver .env.example). Prefijo "" = todas.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // Tailwind v4 vía plugin de Vite (sin PostCSS); la configuración vive en src/styles/globals.css.
    // projectHtmlPlugin: título y favicon del index.html desde project.config.json.
    plugins: [react(), tailwindcss(), projectHtmlPlugin(projectConfigPath)],
    define: {
      // URL del backend; se sobreescribe por entorno. Ver docs/architecture.md §4.
      BACKEND_URL: JSON.stringify(env.BACKEND_URL || "http://localhost:8080"),
      // sockjs-client (realtime, futuro) referencia `global`, no definido en el navegador.
      global: "globalThis",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@project-config": projectConfigPath,
      },
    },
    server: {
      port: 5173,
      host: true,
      // project.config.json vive en la raíz del repo, fuera de modules/frontend.
      fs: { allow: [repoRoot] },
    },
  };
});
