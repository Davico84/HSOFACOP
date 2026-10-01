// Matchers de jest-dom (toBeInTheDocument, etc.) para el `expect` de Vitest.
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./mocks/server";

// Shims de jsdom para librerías de UI (APIs de puntero/scroll/resize no implementadas).
Element.prototype.scrollIntoView = () => {};
Element.prototype.hasPointerCapture = () => false;
Element.prototype.setPointerCapture = () => undefined;
Element.prototype.releasePointerCapture = () => undefined;
globalThis.ResizeObserver = class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// MSW: intercepta las peticiones HTTP a nivel de red durante los tests.
// `onUnhandledRequest: "error"` obliga a mockear explícitamente cada petición.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  cleanup(); // con globals desactivados, RTL no limpia solo entre tests.
});

afterAll(() => server.close());
