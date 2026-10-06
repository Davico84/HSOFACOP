import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { projectHtmlPlugin } from "./vite-plugins/projectHtml";

// Identidad del proyecto (nombre, logos, colores…): ../../project.config.json.
// El manejo de SSL se añadirá cuando una capacidad lo requiera.
const repoRoot = path.resolve(__dirname, "../..");
const projectConfigPath = path.join(repoRoot, "project.config.json");

// Variables VITE_* de .env (ver .env.example): Vite las expone en import.meta.env.
export default defineConfig(() => {
  return {
    // Tailwind v4 vía plugin de Vite (sin PostCSS); la configuración vive en src/styles/globals.css.
    // projectHtmlPlugin: título y favicon del index.html desde project.config.json.
    plugins: [react(), tailwindcss(), projectHtmlPlugin(projectConfigPath)],
    define: {
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
