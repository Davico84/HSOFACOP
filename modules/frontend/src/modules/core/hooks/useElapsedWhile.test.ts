import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useElapsedWhile } from "./useElapsedWhile";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useElapsedWhile", () => {
  it("cuenta segundos mientras está activo", () => {
    const { result } = renderHook(() => useElapsedWhile(true));
    expect(result.current).toBe(0);

    act(() => vi.advanceTimersByTime(5_000));
    expect(result.current).toBe(5);
  });

  it("inactivo devuelve 0 y no deja timers", () => {
    const { result } = renderHook(() => useElapsedWhile(false));
    act(() => vi.advanceTimersByTime(5_000));
    expect(result.current).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("vuelve a 0 al pasar a inactivo y reinicia la cuenta al reactivarse", () => {
    const { result, rerender } = renderHook(({ active }) => useElapsedWhile(active), { initialProps: { active: true } });
    act(() => vi.advanceTimersByTime(7_000));
    expect(result.current).toBe(7);

    rerender({ active: false });
    expect(result.current).toBe(0);
    expect(vi.getTimerCount()).toBe(0);

    rerender({ active: true });
    act(() => vi.advanceTimersByTime(2_000));
    expect(result.current).toBe(2);
  });

  it("limpia el intervalo al desmontar", () => {
    const { unmount } = renderHook(() => useElapsedWhile(true));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
