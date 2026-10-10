// Reglas de aplicación (design D4). Cada regla lee el contenido planificado (o el
// del disco) y devuelve el nuevo. Nunca tocan identificadores técnicos (paquete
// Java, groupId/artifactId/name del pom, name de package.json, orval, etc.).
import { BRAND_TOKENS } from "./config.mjs";
import { updateProperties } from "./properties.mjs";

export const PATHS = {
  applicationYml: "modules/backend/src/main/resources/application.yml",
  pom: "modules/backend/pom.xml",
  rootPackageJson: "package.json",
  contract: "contracts/openapi.json",
  generatedDir: "modules/frontend/src/modules/core/services/generated/",
  secretsExample: "modules/backend/secrets.properties.example",
  secrets: "modules/backend/secrets.properties",
  compose: "modules/backend/compose.yaml",
  globalsCss: "modules/frontend/src/styles/globals.css",
  envExample: "modules/frontend/.env.example",
  env: "modules/frontend/.env",
};

/** Archivos de texto donde se reemplaza el nombre visible (matriz del design). */
export const TEXT_RULE = [
  /^readme\.md$/i,
  /^CLAUDE\.md$/,
  /^SETUP-OPENSPEC\.md$/,
  /^docs\/.+\.md$/,
  /^openspec\/config\.yaml$/,
  /^openspec\/specs\/.+/,
  /^\.github\/.+\.md$/,
  /^\.claude\/skills\/(commit|frontend-guard)\/SKILL\.md$/,
];

/** Excluidos del escáner de restos: historial, in-flight, generados y migraciones aplicadas. */
export const SCAN_EXCLUDE = [
  /^openspec\/changes\//,
  /^pnpm-lock\.yaml$/,
  /^\.template\//,
  /^modules\/backend\/src\/main\/resources\/db\/migration\/V1__init\.sql$/,
];

const yamlString = (value) => JSON.stringify(value); // JSON es YAML válido (escalar entre comillas)
const xmlEscape = (v) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function replaceOnce(text, re, replacement, file) {
  re.lastIndex = 0;
  if (!re.test(text)) throw new Error(`${file}: no se encontró ${re} (¿se editó a mano?)`);
  re.lastIndex = 0;
  return text.replace(re, replacement);
}

/** Fin (exclusivo) del objeto JSON que abre en `start` (`{`), saltando el contenido de los strings. */
function objectEnd(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      for (i++; text[i] !== '"'; i++) if (text[i] === "\\") i++;
    } else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return i + 1;
  }
  throw new Error("objeto JSON sin cerrar");
}

/**
 * Reemplaza solo el objeto `info` de nivel superior del contrato, sin reserializar el resto:
 * `JSON.stringify` ordena primero las claves numéricas ("200", "404"…) y cambiaría el orden que
 * genera el backend.
 */
function replaceContractInfo(text, patch, file) {
  const contract = JSON.parse(text); // valida y da el `info` actual
  const match = /^( *)"info"\s*:\s*\{/m.exec(text);
  if (!match || !contract.info) throw new Error(`${file}: no se encontró "info" (¿se editó a mano?)`);
  const start = match.index + match[0].length - 1;
  const end = objectEnd(text, start);
  const info = JSON.stringify({ ...contract.info, ...patch }, null, 2).replace(/\n/g, `\n${match[1]}`);
  const out = text.slice(0, start) + info + text.slice(end);
  JSON.parse(out); // sigue siendo JSON válido
  return out;
}

export const dbUrl = (db) => `jdbc:postgresql://localhost:${db.port}/${db.name}`;

export function dbKeys(to) {
  return {
    DB_CONTAINER_NAME: to.database.container,
    DB_PORT: String(to.database.port),
    DB_URL: dbUrl(to.database),
    DB_NAME: to.database.name,
    DB_USERNAME: to.database.user,
    JWT_ISSUER: to.jwtIssuer,
  };
}

/** Reglas por archivo versionado: `{ file, apply(text, from, to) }`. */
export const FILE_RULES = [
  {
    file: PATHS.applicationYml,
    apply(text, _from, to) {
      const f = PATHS.applicationYml;
      let out = replaceOnce(text, /^(app:\n(?:\s*#.*\n)*  name: ).*$/m, `$1${yamlString(to.name)}`, f);
      out = replaceOnce(out, /^(app:\n(?:.*\n)*?  description: ).*$/m, `$1${yamlString(to.description)}`, f);
      return replaceOnce(out, /(issuer: \$\{JWT_ISSUER:)[^}]*\}/, `$1${to.jwtIssuer}}`, f);
    },
  },
  {
    file: PATHS.pom,
    apply: (text, _from, to) =>
      replaceOnce(text, /<description>[^<]*<\/description>/, `<description>${xmlEscape(to.name)} - backend</description>`, PATHS.pom),
  },
  {
    file: PATHS.rootPackageJson,
    apply: (text, _from, to) =>
      replaceOnce(
        text,
        /"description":\s*"(?:[^"\\]|\\.)*"/,
        `"description": ${JSON.stringify(`${to.name} - raíz del monorepo (hooks y calidad de commits)`)}`,
        PATHS.rootPackageJson,
      ),
  },
  {
    file: PATHS.contract,
    apply: (text, _from, to) =>
      replaceContractInfo(text, { title: `${to.name} API`, description: to.description }, PATHS.contract),
  },
  {
    file: PATHS.secretsExample,
    apply: (text, _from, to) => updateProperties(text, dbKeys(to)),
  },
  {
    file: PATHS.compose,
    apply(text, _from, to) {
      // Aparece dos veces: `name:` del proyecto (volumen propio) y `container_name`.
      let out = replaceOnce(text, /(\$\{DB_CONTAINER_NAME:-)[^}]*\}/g, `$1${to.database.container}}`, PATHS.compose);
      return replaceOnce(out, /(\$\{DB_PORT:-)[^}]*\}/, `$1${to.database.port}}`, PATHS.compose);
    },
  },
  {
    file: PATHS.globalsCss,
    apply: (text, _from, to) => applyBrandColors(text, to.brand.colors),
  },
];

/** Cabecera del cliente generado por orval: mismas líneas que el `info` del contrato. */
export function applyGeneratedHeader(text, from, to) {
  return text
    .replace(new RegExp(`^( \\* )${escapeRe(`${from.name} API`)}$`, "m"), `$1${to.name} API`)
    .replace(new RegExp(`^( \\* )${escapeRe(from.description)}$`, "m"), `$1${to.description}`);
}

const BLOCK = /\/\* @template:brand[^*]*\*\/([\s\S]*?)\/\* @end-template:brand \*\//g;

/** Tokens declarados en el primer bloque de marca (los que la config puede fijar). */
export function brandTokensIn(css) {
  const first = [...css.matchAll(BLOCK)][0];
  if (!first) return BRAND_TOKENS;
  return [...first[1].matchAll(/--([\w-]+)\s*:/g)].map((m) => m[1]);
}

/** Reescribe los valores del bloque de :root (claro) y del de .dark (oscuro). */
export function applyBrandColors(css, colors) {
  const modes = ["light", "dark"];
  let index = 0;
  const out = css.replace(BLOCK, (block) => {
    const palette = colors[modes[index++]] ?? {};
    let updated = block;
    for (const [token, value] of Object.entries(palette)) {
      updated = updated.replace(new RegExp(`(--${escapeRe(token)}:\\s*)[^;]+;`), `$1${value};`);
    }
    return updated;
  });
  if (index !== 2) throw new Error(`${PATHS.globalsCss}: se esperaban 2 bloques @template:brand (:root y .dark), hay ${index}`);
  return out;
}
