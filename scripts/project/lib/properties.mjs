// Actualización por clave de archivos .properties (design D4): reescribe solo las
// líneas `CLAVE=` indicadas y conserva orden, comentarios, líneas vacías y claves
// desconocidas. Las claves que no existen se añaden al final.

export function updateProperties(text, updates) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const pending = new Map(Object.entries(updates).filter(([, v]) => v !== undefined));
  const lines = text.split(/\r?\n/);
  const out = lines.map((line) => {
    const m = /^([A-Za-z_][A-Za-z0-9_.]*)=/.exec(line);
    if (!m || !pending.has(m[1])) return line;
    const value = pending.get(m[1]);
    pending.delete(m[1]);
    return `${m[1]}=${value}`;
  });
  if (pending.size > 0) {
    if (out.length && out[out.length - 1] === "") out.pop();
    for (const [key, value] of pending) out.push(`${key}=${value}`);
    out.push("");
  }
  return out.join(eol);
}

export function readProperty(text, key) {
  const m = new RegExp(`^${key}=(.*)$`, "m").exec(text);
  return m ? m[1].trim() : undefined;
}
