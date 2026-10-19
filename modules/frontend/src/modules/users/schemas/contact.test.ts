import { describe, expect, it } from "vitest";
import { contactPayload, contactSchema } from "./contact";

const EMPTY = { phone: "", documentType: "", documentNumber: "", copNumber: "" };

function errorsOf(values: Partial<typeof EMPTY>) {
  const result = contactSchema.safeParse({ ...EMPTY, ...values });
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
}

describe("contactSchema (paridad con ContactFields)", () => {
  it("todo vacío es válido y se envía como null", () => {
    expect(errorsOf({})).toEqual({});
    expect(contactPayload(EMPTY)).toEqual({
      phone: null, documentType: null, documentNumber: null, copNumber: null,
    });
  });

  it("celular de 9 dígitos que empieza con 9", () => {
    expect(errorsOf({ phone: "987654321" })).toEqual({});
    expect(errorsOf({ phone: "87654321" })).toHaveProperty("phone");
    expect(errorsOf({ phone: "887654321" })).toHaveProperty("phone");
  });

  it("documento con tipo y número juntos y del formato del tipo", () => {
    expect(errorsOf({ documentType: "DNI", documentNumber: "74125896" })).toEqual({});
    expect(errorsOf({ documentType: "DNI" })).toEqual({ documentNumber: "Indica el número del documento." });
    expect(errorsOf({ documentNumber: "74125896" })).toEqual({ documentType: "Indica el tipo de documento." });
    expect(errorsOf({ documentType: "DNI", documentNumber: "7412589" })).toEqual({ documentNumber: "El DNI debe tener 8 dígitos." });
  });

  it("COP de 1 a 6 dígitos", () => {
    expect(errorsOf({ copNumber: "12345" })).toEqual({});
    expect(errorsOf({ copNumber: "1234567" })).toHaveProperty("copNumber");
  });
});
