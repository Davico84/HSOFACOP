import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { TruncatedText } from "./TruncatedText";

/** jsdom no mide: se simula el ancho del contenido y el visible. */
function sizes(el: HTMLElement, scrollWidth: number, clientWidth: number) {
  Object.defineProperty(el, "scrollWidth", { configurable: true, value: scrollWidth });
  Object.defineProperty(el, "clientWidth", { configurable: true, value: clientWidth });
}

describe("TruncatedText", () => {
  it("cortado: muestra el texto completo en un tooltip al pasar el ratón", async () => {
    renderWithProviders(<TruncatedText text="brand-1791214561319-934632@empresa.test" />);
    const text = screen.getByText("brand-1791214561319-934632@empresa.test");
    sizes(text, 400, 200);

    await userEvent.hover(text);

    expect(await screen.findByRole("tooltip")).toHaveTextContent("brand-1791214561319-934632@empresa.test");
  });

  it("si cabe, no muestra tooltip", async () => {
    renderWithProviders(<TruncatedText text="ana@empresa.test" />);
    const text = screen.getByText("ana@empresa.test");
    sizes(text, 120, 200);

    await userEvent.hover(text);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
