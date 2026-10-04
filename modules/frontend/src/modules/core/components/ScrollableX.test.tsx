import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ScrollableX } from "./ScrollableX";

/** jsdom no maqueta: se fijan las medidas de la caja a mano. */
function size(el: HTMLElement, { scrollWidth, clientWidth, scrollLeft }: { scrollWidth: number; clientWidth: number; scrollLeft: number }) {
  Object.defineProperty(el, "scrollWidth", { configurable: true, value: scrollWidth });
  Object.defineProperty(el, "clientWidth", { configurable: true, value: clientWidth });
  el.scrollLeft = scrollLeft;
}

describe("ScrollableX", () => {
  it("indica el contenido oculto a cada lado según la posición del desplazamiento", () => {
    render(
      <ScrollableX>
        <table aria-label="Tabla ancha" />
      </ScrollableX>,
    );
    const box = screen.getByRole("table").parentElement as HTMLElement;
    const wrapper = box.parentElement as HTMLElement;

    size(box, { scrollWidth: 800, clientWidth: 300, scrollLeft: 0 });
    fireEvent.scroll(box);
    expect(wrapper).not.toHaveAttribute("data-more-start");
    expect(wrapper).toHaveAttribute("data-more-end");

    size(box, { scrollWidth: 800, clientWidth: 300, scrollLeft: 250 });
    fireEvent.scroll(box);
    expect(wrapper).toHaveAttribute("data-more-start");
    expect(wrapper).toHaveAttribute("data-more-end");

    size(box, { scrollWidth: 800, clientWidth: 300, scrollLeft: 500 });
    fireEvent.scroll(box);
    expect(wrapper).toHaveAttribute("data-more-start");
    expect(wrapper).not.toHaveAttribute("data-more-end");
  });

  it("sin desbordamiento no muestra ningún degradado", () => {
    render(
      <ScrollableX>
        <table aria-label="Tabla" />
      </ScrollableX>,
    );
    const box = screen.getByRole("table").parentElement as HTMLElement;
    size(box, { scrollWidth: 300, clientWidth: 300, scrollLeft: 0 });
    fireEvent.scroll(box);
    expect(box.parentElement).not.toHaveAttribute("data-more-start");
    expect(box.parentElement).not.toHaveAttribute("data-more-end");
  });
});
