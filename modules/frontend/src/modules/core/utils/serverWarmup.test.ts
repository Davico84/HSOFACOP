import { describe, expect, it } from "vitest";
import { estimatedProgress, warmupStage } from "./serverWarmup";

describe("serverWarmup", () => {
  it("etapas por tiempo, con 'sin red' por encima de todas", () => {
    expect(warmupStage(0, true)).toBe("loading");
    expect(warmupStage(3, true)).toBe("loading");
    expect(warmupStage(4, true)).toBe("warming");
    expect(warmupStage(89, true)).toBe("warming");
    expect(warmupStage(90, true)).toBe("stuck");
    expect(warmupStage(0, false)).toBe("offline");
    expect(warmupStage(120, false)).toBe("offline");
  });

  it("el progreso estimado crece, ronda el 85 % al minuto y nunca llega al 100 %", () => {
    expect(estimatedProgress(0)).toBe(0);
    expect(estimatedProgress(10)).toBeLessThan(estimatedProgress(30));
    expect(estimatedProgress(60)).toBeGreaterThanOrEqual(80);
    expect(estimatedProgress(60)).toBeLessThanOrEqual(90);
    expect(estimatedProgress(10_000)).toBeLessThan(100);
  });
});
