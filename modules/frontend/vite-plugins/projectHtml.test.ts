import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { faviconType, projectHtmlPlugin, renderProjectHtml } from "./projectHtml";

// Scenario "Título de la pestaña desde la configuración" (template-bootstrap).
const frontendDir = path.resolve(__dirname, "..");
const configPath = path.resolve(frontendDir, "../../project.config.json");
const indexHtml = readFileSync(path.join(frontendDir, "index.html"), "utf8");
const config = JSON.parse(readFileSync(configPath, "utf8")) as { name: string; brand: { favicon: string } };

describe("template-bootstrap — Título de la pestaña desde la configuración", () => {
  it("Título de la pestaña desde la configuración: <title> y favicon del index.html real", () => {
    const hook = projectHtmlPlugin(configPath).transformIndexHtml as (html: string) => string;
    const html = hook(indexHtml);

    expect(html).toContain(`<title>${config.name}</title>`);
    expect(html).toContain(`href="${config.brand.favicon}"`);
    expect(html).toContain(`type="${faviconType(config.brand.favicon)}"`);
    expect(html).not.toMatch(/%PROJECT_\w+%/);
  });

  it("escapa el nombre y deriva el tipo del favicon", () => {
    const html = renderProjectHtml("<title>%PROJECT_NAME%</title>%PROJECT_FAVICON_TYPE%", {
      name: "A & <B>",
      brand: { favicon: "/brand/favicon.PNG" },
    });
    expect(html).toBe("<title>A &amp; &lt;B&gt;</title>image/png");
  });
});
