import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberInput } from "./number-input";

function Controlled({ initial = null, min }: { initial?: number | null; min?: number }) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <>
      <NumberInput aria-label="Medida" step={0.1} min={min} value={value} onChange={setValue} />
      <output aria-label="Valor">{value === null ? "vacío" : String(value)}</output>
    </>
  );
}

describe("NumberInput", () => {
  it("los botones suben y bajan un paso sin restos de coma flotante", async () => {
    render(<Controlled initial={0.2} />);
    await userEvent.click(screen.getByRole("button", { name: "Aumentar" }));
    expect(screen.getByLabelText("Valor")).toHaveTextContent("0.3");
    await userEvent.click(screen.getByRole("button", { name: "Disminuir" }));
    await userEvent.click(screen.getByRole("button", { name: "Disminuir" }));
    expect(screen.getByLabelText("Valor")).toHaveTextContent("0.1");
  });

  it("desde vacío parte del mínimo y no baja de él", async () => {
    render(<Controlled min={0} />);
    await userEvent.click(screen.getByRole("button", { name: "Disminuir" }));
    expect(screen.getByLabelText("Valor")).toHaveTextContent("0");
    await userEvent.click(screen.getByRole("button", { name: "Aumentar" }));
    expect(screen.getByLabelText("Valor")).toHaveTextContent("0.1");
  });

  it("escribir y borrar: vacío es null; los botones no reciben foco con Tab", async () => {
    render(<Controlled />);
    const input = screen.getByLabelText("Medida");
    await userEvent.type(input, "5.4");
    expect(screen.getByLabelText("Valor")).toHaveTextContent("5.4");
    await userEvent.clear(input);
    expect(screen.getByLabelText("Valor")).toHaveTextContent("vacío");
    expect(screen.getByRole("button", { name: "Aumentar" })).toHaveAttribute("tabindex", "-1");
  });
});
