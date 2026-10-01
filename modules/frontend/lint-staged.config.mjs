// lint-staged para el frontend. Se ejecuta desde modules/frontend vía el
// hook pre-commit de la raíz (solo cuando el commit toca modules/frontend/).
export default {
  "*.{ts,tsx}": ["eslint --fix"],
  // tsc no acepta archivos sueltos: se ejecuta el build del proyecto completo.
  "*.{ts,tsx,json}": () => "tsc -b",
};
