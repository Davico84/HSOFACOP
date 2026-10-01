// Gramática cerrada de colores de marca (design D3):
//  - hex sin alpha: #rgb o #rrggbb → se guarda tal cual en minúsculas (sin pérdida)
//  - hsl sin alpha: hsl(H S% L%) o hsl(H, S%, L%), H 0–360, S/L 0–100 (enteros o 1 decimal)
//    → se normaliza a hsl(H S% L%)
// Cualquier otra forma es inválida (null).

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const NUM = "(\\d{1,3}(?:\\.\\d)?)";
const HSL = new RegExp(`^hsl\\(\\s*${NUM}\\s*(?:,\\s*|\\s+)${NUM}%\\s*(?:,\\s*|\\s+)${NUM}%\\s*\\)$`, "i");

/** Devuelve el color normalizado o `null` si no cumple la gramática. */
export function parseColor(input) {
  const value = String(input ?? "").trim();
  if (HEX.test(value)) return value.toLowerCase();
  const m = HSL.exec(value);
  if (!m) return null;
  const [h, s, l] = m.slice(1).map(Number);
  if (h > 360 || s > 100 || l > 100) return null;
  return `hsl(${h} ${s}% ${l}%)`;
}
