import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandPanel } from "./BrandPanel";
import { ServerWarmupScreen } from "./ServerWarmupScreen";

// Proyecto sin `contact` (p. ej. recién creado desde la plantilla).
vi.mock("@/config/project", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config/project")>();
  return { ...actual, project: { ...actual.project, contact: undefined } };
});

describe("project-foundation — Contacto de soporte: sin contacto configurado", () => {
  it("Sin contacto configurado: no hay bloque y la espera larga conserva el aviso al administrador", () => {
    render(<BrandPanel />);
    expect(screen.queryByText("¿Necesitas ayuda?")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    render(<ServerWarmupScreen elapsedSeconds={95} online onRetry={() => undefined} />);
    expect(screen.getByText("Si el problema continúa, avisa al administrador.")).toBeInTheDocument();
    expect(screen.queryByText("Si el problema continúa, escríbenos:")).not.toBeInTheDocument();
  });
});
