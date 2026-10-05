import { beforeEach, describe, expect, it } from "vitest";
import { useSidebarStore } from "./useSidebarStore";

describe("useSidebarStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useSidebarStore.setState({ collapsed: false });
  });

  it("arranca expandida y alterna con toggle", () => {
    expect(useSidebarStore.getState().collapsed).toBe(false);
    useSidebarStore.getState().toggle();
    expect(useSidebarStore.getState().collapsed).toBe(true);
    useSidebarStore.getState().toggle();
    expect(useSidebarStore.getState().collapsed).toBe(false);
  });

  it("recuerda la preferencia en el navegador y la recupera al rehidratar", async () => {
    useSidebarStore.getState().setCollapsed(true);
    expect(JSON.parse(localStorage.getItem("hsfacop.sidebar") ?? "{}").state.collapsed).toBe(true);

    useSidebarStore.setState({ collapsed: false });
    localStorage.setItem("hsfacop.sidebar", JSON.stringify({ state: { collapsed: true }, version: 0 }));
    await useSidebarStore.persist.rehydrate();
    expect(useSidebarStore.getState().collapsed).toBe(true);
  });
});
