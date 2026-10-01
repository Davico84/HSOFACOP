/** Opción de un campo de selección. `image` la muestra como tarjeta seleccionable. */
export interface ChoiceOption<V extends string = string> {
  value: V;
  label: string;
  image?: string;
}
