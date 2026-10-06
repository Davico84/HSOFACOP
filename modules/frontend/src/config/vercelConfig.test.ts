import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// vercel.json vive en la raíz del repo (Root Directory de Vercel = raíz): ver docs/deployment.md.
const config = JSON.parse(readFileSync(path.resolve(__dirname, "../../../../vercel.json"), "utf8")) as {
  installCommand: string;
  buildCommand: string;
  outputDirectory: string;
  rewrites: { source: string; destination: string }[];
};

describe("cloud-deployment — Reglas de reenvío", () => {
  it("/api y /auth van al backend antes del fallback de la SPA, y /actuator no se reenvía", () => {
    const sources = config.rewrites.map((rule) => rule.source);
    expect(sources).toEqual(["/api/:path*", "/auth/:path*", "/(.*)"]);

    const [api, auth, spa] = config.rewrites;
    const backend = new URL(api.destination).origin;
    expect(backend).toMatch(/^https:\/\/[a-z0-9-]+\.onrender\.com$/);
    expect(api.destination).toBe(`${backend}/api/:path*`);
    expect(auth.destination).toBe(`${backend}/auth/:path*`);
    expect(spa.destination).toBe("/index.html");
    expect(config.rewrites.some((rule) => rule.source.includes("actuator") || rule.destination.includes("actuator"))).toBe(false);
  });

  it("el build instala con el lockfile de la raíz y publica modules/frontend/dist", () => {
    expect(config.installCommand).toBe("pnpm install --frozen-lockfile");
    expect(config.buildCommand).toBe("pnpm --filter odontorisas-frontend build");
    expect(config.outputDirectory).toBe("modules/frontend/dist");
  });
});
