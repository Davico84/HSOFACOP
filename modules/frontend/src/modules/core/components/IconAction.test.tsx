import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Gauge } from "lucide-react";
import { renderWithProviders } from "@/test/utils";
import { IconAction } from "./IconAction";

describe("IconAction", () => {
  it("nombre accesible completo, tooltip corto al enfocar y clic", async () => {
    const onClick = vi.fn();
    renderWithProviders(
      <IconAction icon={Gauge} label="Cupo de historias" ariaLabel="Cambiar el cupo de Ana" onClick={onClick} />,
    );

    const button = screen.getByRole("button", { name: "Cambiar el cupo de Ana" });
    await userEvent.tab();
    expect(button).toHaveFocus();
    expect(await screen.findByRole("tooltip", { name: "Cupo de historias" })).toBeInTheDocument();

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("en curso: ocupada y sin ejecutar otra vez", async () => {
    const onClick = vi.fn();
    renderWithProviders(<IconAction icon={Gauge} label="Cupo" onClick={onClick} loading />);

    const button = screen.getByRole("button", { name: "Cupo" });
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("deshabilitada no ejecuta la acción", async () => {
    const onClick = vi.fn();
    renderWithProviders(<IconAction icon={Gauge} label="Cupo" onClick={onClick} disabled />);

    await userEvent.click(screen.getByRole("button", { name: "Cupo" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
