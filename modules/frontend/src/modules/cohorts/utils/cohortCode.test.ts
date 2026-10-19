import { describe, expect, it } from "vitest";
import { cleanCohortCode, formatCohortCode } from "./cohortCode";

describe("cohortCode", () => {
  it("limpia mayúsculas, espacios y guiones como el servidor", () => {
    expect(cleanCohortCode(" k7qm - 4txr ")).toBe("K7QM4TXR");
    expect(cleanCohortCode("")).toBe("");
  });

  it("muestra el código en dos grupos de 4", () => {
    expect(formatCohortCode("K7QM4TXR")).toBe("K7QM-4TXR");
    expect(formatCohortCode("abc")).toBe("ABC");
  });
});
