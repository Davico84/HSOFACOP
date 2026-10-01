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
    apply(text, _from, to) {
      const contract = JSON.parse(text);
      contract.info = { ...contract.info, title: `${to.name} API`, description: to.description };
      return JSON.stringify(contract, null, 2) + "\n";
    },
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
