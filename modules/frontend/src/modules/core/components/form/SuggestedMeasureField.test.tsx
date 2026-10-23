import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { SuggestedMeasureField } from "./SuggestedMeasureField";

interface Values {
  sum: number | null;
}

const format = (n: number) => n.toFixed(1).replace(".", ",");

function Harness({ initial, suggested }: { initial: number | null; suggested: number | null }) {
  const form = useForm<Values>({ defaultValues: { sum: initial } });
  const sum = useWatch({ control: form.control, name: "sum" });
  return (
    <FormProvider {...form}>
      <output data-testid="value">{String(sum)}</output>
      <output data-testid="dirty">{String(form.formState.isDirty)}</output>
      <SuggestedMeasureField<Values>
        name="sum"
        label="Suma de los incisivos"
        unit="mm"
        suggestedValue={suggested}
        suggestedNote="Tomada de los incisivos de Moyers."
        missingNote="Completa los incisivos en Moyers o escribe la suma."
        sourceLabel="Moyers"
        formatValue={format}
      />
    </FormProvider>
  );
}

describe("SuggestedMeasureField", () => {
  it("sugerida: campo vacío con la sugerencia de marcador y la nota con su valor; no modifica el formulario", () => {
    render(<Harness initial={null} suggested={23} />);

    const input = screen.getByLabelText("Suma de los incisivos");
    expect(input).toHaveValue(null);
    expect(input).toHaveAttribute("placeholder", "23,0");
    expect(screen.getByText("Se usa 23,0 mm. Tomada de los incisivos de Moyers.")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-describedby", expect.stringContaining("note"));
    expect(screen.getByTestId("value")).toHaveTextContent("null");
    expect(screen.getByTestId("dirty")).toHaveTextContent("false");
  });

  it("Suma escrita por el tratante: la nota lo indica con el valor calculado y ofrece volver a él", async () => {
    render(<Harness initial={null} suggested={23} />);

    await userEvent.type(screen.getByLabelText("Suma de los incisivos"), "23.5");

    expect(screen.getByTestId("value")).toHaveTextContent("23.5");
    expect(screen.getByText("Valor escrito por ti · Moyers da 23,0 mm.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Usar la suma calculada de Moyers (23,0 mm)" }));
    expect(screen.getByTestId("value")).toHaveTextContent("null");
    expect(screen.getByText("Se usa 23,0 mm. Tomada de los incisivos de Moyers.")).toBeInTheDocument();
  });

  it("Borrar una suma escrita vuelve a la sugerencia (nula)", async () => {
    render(<Harness initial={23.5} suggested={23} />);

    await userEvent.clear(screen.getByLabelText("Suma de los incisivos"));

    expect(screen.getByTestId("value")).toHaveTextContent("null");
    expect(screen.getByText("Se usa 23,0 mm. Tomada de los incisivos de Moyers.")).toBeInTheDocument();
  });

  it("sin sugerencia: la nota dice qué completar y no hay 'Usar el de …'", () => {
    render(<Harness initial={null} suggested={null} />);

    expect(screen.getByText("Completa los incisivos en Moyers o escribe la suma.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Usar la suma/ })).not.toBeInTheDocument();
  });
});
