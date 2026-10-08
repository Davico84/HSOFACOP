import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWindowReturn } from "./useWindowReturn";

let visibility: DocumentVisibilityState = "visible";

function pageshow(persisted: boolean) {
  const event = new Event("pageshow");
  Object.defineProperty(event, "persisted", { value: persisted });
  window.dispatchEvent(event);
}

const returnToTab = () => document.dispatchEvent(new Event("visibilitychange"));

beforeEach(() => {
  vi.useFakeTimers();
  visibility = "visible";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useWindowReturn", () => {
  it("visibilidad, foco y pageshow al volver cuentan como una sola vuelta en 5 s", () => {
    const onReturn = vi.fn();
    renderHook(() => useWindowReturn(onReturn, { minIntervalMs: 5_000 }));

    returnToTab();
    window.dispatchEvent(new Event("focus"));
    pageshow(true);
    expect(onReturn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5_000);
    window.dispatchEvent(new Event("focus"));
    expect(onReturn).toHaveBeenCalledTimes(2);
  });

  it("con la pestaña oculta no llama, y pageshow sin persisted no cuenta", () => {
    const onReturn = vi.fn();
    renderHook(() => useWindowReturn(onReturn, { minIntervalMs: 5_000 }));

    visibility = "hidden";
    returnToTab();
    window.dispatchEvent(new Event("focus"));
    visibility = "visible";
    pageshow(false);

    expect(onReturn).not.toHaveBeenCalled();
  });

  it("desactivado o desmontado no escucha", () => {
    const onReturn = vi.fn();
    const { rerender, unmount } = renderHook(({ enabled }) => useWindowReturn(onReturn, { minIntervalMs: 5_000, enabled }), {
      initialProps: { enabled: false },
    });
    window.dispatchEvent(new Event("focus"));
    expect(onReturn).not.toHaveBeenCalled();

    rerender({ enabled: true });
    unmount();
    window.dispatchEvent(new Event("focus"));
    expect(onReturn).not.toHaveBeenCalled();
  });
});
