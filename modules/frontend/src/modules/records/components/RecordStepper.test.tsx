import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecordStepper } from "./RecordStepper";

describe("RecordStepper", () => {
  afterEach(() => vi.restoreAllMocks());

  it("desplaza el paso actual a la vista y anuncia 'Paso N de 8'", () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    const { rerender } = render(<RecordStepper current={8} disabled={false} onSelect={() => undefined} />);

    expect(screen.getByText("Paso 8 de 8 · Firmas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Firmas/ })).toHaveAttribute("aria-current", "step");
    expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ inline: "center", block: "nearest" }));
    expect(scroll.mock.contexts.at(-1)).toBe(screen.getByRole("button", { name: /Firmas/ }));

    rerender(<RecordStepper current={2} disabled={false} onSelect={() => undefined} />);
    expect(scroll.mock.contexts.at(-1)).toBe(screen.getByRole("button", { name: /Análisis facial/ }));
  });

  it("cada paso conserva su título como nombre accesible", () => {
    Element.prototype.scrollIntoView = vi.fn();
    render(<RecordStepper current={1} disabled={false} onSelect={() => undefined} />);
    expect(screen.getAllByRole("button")).toHaveLength(8);
    expect(screen.getByRole("button", { name: /Diagnóstico y planes/ })).toBeInTheDocument();
  });
});
