import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import { project } from "@/config/project";
import { LoginView } from "@/screens/auth/LoginView";
import { RegisterView } from "@/screens/auth/RegisterView";

// Scenario "La UI muestra la identidad configurada" (template-bootstrap): los textos y
// logos salen de project.config.json, sin copias en el código.
function expectBrand(subtitle: string) {
  expect(screen.getByRole("heading", { level: 2, name: project.tagline })).toBeInTheDocument();
  expect(screen.getByText(project.description)).toBeInTheDocument();
  expect(screen.getByText(`© ${project.name}`)).toBeInTheDocument();
  expect(screen.getByText(subtitle)).toBeInTheDocument();

  const logos = screen.getAllByRole("img", { name: project.name });
  const sources = logos.map((img) => img.getAttribute("src"));
  expect(sources).toEqual(
    expect.arrayContaining([project.brand.logo.white, project.brand.logo.light, project.brand.logo.dark]),
  );
}

describe("template-bootstrap — Configuración única de la identidad visible", () => {
  it("La UI muestra la identidad configurada: login", () => {
    renderWithProviders(<LoginView />, { initialEntries: ["/ingresar"] });
    expect(within(screen.getByRole("main")).getByRole("heading", { level: 1 })).toHaveTextContent("Iniciar sesión");
    expectBrand(`Accede a tu panel de ${project.name}`);
  });

  it("La UI muestra la identidad configurada: registro", () => {
    renderWithProviders(<RegisterView />, { initialEntries: ["/registro"] });
    expect(within(screen.getByRole("main")).getByRole("heading", { level: 1 })).toHaveTextContent("Crear cuenta");
    expectBrand(`Regístrate para empezar a usar ${project.name}`);
  });
});
