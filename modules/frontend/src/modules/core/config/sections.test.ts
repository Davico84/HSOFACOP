import { describe, it, expect } from "vitest";
import { canAccess, sectionById, sections, type SectionConfig } from "./sections";
import { navItemsFor } from "@/modules/core/components/shell/navItems";

describe("sections — una sola fuente de verdad", () => {
  it("ids y rutas son únicos (una ruta no puede tener dos políticas)", () => {
    expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length);
    expect(new Set(sections.map((s) => s.path)).size).toBe(sections.length);
  });

  it("sectionById devuelve la sección declarada", () => {
    expect(sectionById("moduleB")).toMatchObject({ path: "/modulo-b", roles: ["ADMIN"] });
  });

  it("canAccess: sin roles cualquiera; con roles solo los listados", () => {
    expect(canAccess(sectionById("moduleA"), "USER")).toBe(true);
    expect(canAccess(sectionById("moduleA"), "ADMIN")).toBe(true);
    expect(canAccess(sectionById("moduleB"), "USER")).toBe(false);
    expect(canAccess(sectionById("moduleB"), "ADMIN")).toBe(true);
  });

  it("los roles salen del contrato: uno mal escrito no compila", () => {
    // @ts-expect-error "ADMN" no es un UserResponseRole (si compilara, typecheck fallaría aquí)
    const typo: SectionConfig = { id: "moduleB", path: "/x", roles: ["ADMN"] };
    expect(typo).toBeDefined();
  });

  it("navItemsFor filtra por rol y toma la ruta de la sección", () => {
    expect(navItemsFor("USER").map((i) => i.label)).toEqual(["Inicio", "Módulo A"]);
    expect(navItemsFor("ADMIN").map((i) => [i.label, i.to])).toEqual([
      ["Inicio", "/"],
      ["Módulo A", "/modulo-a"],
      ["Módulo B", "/modulo-b"],
      ["Usuarios", "/usuarios"],
    ]);
  });
});
