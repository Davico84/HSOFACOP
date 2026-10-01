// Carga y validación de project.config.json (design D1). Sin dependencias.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { parseColor } from "./color.mjs";

export const CONFIG_FILE = "project.config.json";
export const APPLIED_FILE = ".template/applied.json";
export const BRAND_TOKENS = ["primary", "ring", "brand-start", "brand-end"];

const DB_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
// También es el nombre del proyecto de Docker Compose: solo minúsculas, dígitos, '-' y '_'.
const CONTAINER = /^[a-z0-9][a-z0-9_-]*$/;
const ISSUER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,99}$/;
const PUBLIC_PATH = /^\/[A-Za-z0-9_./-]+$/;

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

/** Quita `$schema` (propio del editor) para comparar/guardar identidades. */
export function stripSchema(config) {
  const { $schema: _ignored, ...rest } = config;
  return rest;
}

export function loadConfig(root) {
  const file = path.join(root, CONFIG_FILE);
  if (!existsSync(file)) throw new Error(`No existe ${CONFIG_FILE} en la raíz del repo.`);
  try {
    return readJson(file);
  } catch (e) {
    throw new Error(`${CONFIG_FILE} no es JSON válido: ${e.message}`);
  }
}

export function loadApplied(root) {
  const file = path.join(root, APPLIED_FILE);
  if (!existsSync(file)) {
    throw new Error(`Falta ${APPLIED_FILE} (identidad aplicada). No se puede saber qué reemplazar.`);
  }
  return readJson(file);
}

const isText = (v, min, max) => typeof v === "string" && v.trim().length >= min && v.length <= max;

/** Valida un campo suelto; devuelve el mensaje de error o `null`. Lo reusa el asistente. */
export const validators = {
  name: (v) => (isText(v, 1, 60) ? null : "debe tener entre 1 y 60 caracteres"),
  tagline: (v) => (isText(v, 1, 200) ? null : "debe tener entre 1 y 200 caracteres"),
  description: (v) => (isText(v, 1, 200) ? null : "debe tener entre 1 y 200 caracteres"),
  dbIdent: (v) => (typeof v === "string" && DB_IDENT.test(v) ? null : "solo letras, números y _ (sin empezar por número)"),
  container: (v) =>
    typeof v === "string" && CONTAINER.test(v) ? null : "solo minúsculas, números, '-' y '_' (ej: mi-proyecto-db)",
  port: (v) => (Number.isInteger(v) && v >= 1 && v <= 65535 ? null : "debe ser un entero entre 1 y 65535"),
  jwtIssuer: (v) => (typeof v === "string" && ISSUER.test(v) ? null : "solo letras, números y . _ : / -"),
  publicPath: (v) => (typeof v === "string" && PUBLIC_PATH.test(v) ? null : "debe ser una ruta pública como /brand/logo.svg"),
  color: (v) => (parseColor(v) ? null : "usa #rgb, #rrggbb o hsl(H S% L%) sin alpha"),
};

/**
 * Valida la config completa. Devuelve `[]` o una lista de errores `campo: motivo`.
 * `brandTokens`: tokens existentes en el bloque de marca de globals.css.
 */
export function validateConfig(config, { brandTokens = BRAND_TOKENS } = {}) {
  const errors = [];
  const check = (field, value, validator) => {
    if (value === undefined || value === null) return errors.push(`${field}: es obligatorio`);
    const msg = validator(value);
    if (msg) errors.push(`${field}: ${msg}`);
  };
  if (typeof config !== "object" || config === null) return ["config: debe ser un objeto JSON"];

  check("name", config.name, validators.name);
  check("tagline", config.tagline, validators.tagline);
  check("description", config.description, validators.description);
  const db = config.database ?? {};
  if (!config.database) errors.push("database: es obligatorio");
  else {
    check("database.name", db.name, validators.dbIdent);
    check("database.user", db.user, validators.dbIdent);
    check("database.port", db.port, validators.port);
    check("database.container", db.container, validators.container);
  }
  check("jwtIssuer", config.jwtIssuer, validators.jwtIssuer);

  const brand = config.brand;
  if (!brand) errors.push("brand: es obligatorio");
  else {
    for (const variant of ["light", "dark", "white"]) {
      check(`brand.logo.${variant}`, brand.logo?.[variant], validators.publicPath);
    }
    check("brand.favicon", brand.favicon, validators.publicPath);
    for (const mode of ["light", "dark"]) {
      const palette = brand.colors?.[mode];
      if (!palette) {
        errors.push(`brand.colors.${mode}: es obligatorio`);
        continue;
      }
      for (const [token, value] of Object.entries(palette)) {
        if (!brandTokens.includes(token)) {
          errors.push(`brand.colors.${mode}.${token}: no es un token de marca (${brandTokens.join(", ")})`);
        } else {
          check(`brand.colors.${mode}.${token}`, value, validators.color);
        }
      }
    }
  }
  return errors;
}

/** Normaliza los colores de la config al formato guardado. */
export function normalizeColors(config) {
  const copy = structuredClone(config);
  for (const mode of ["light", "dark"]) {
    for (const token of Object.keys(copy.brand?.colors?.[mode] ?? {})) {
      copy.brand.colors[mode][token] = parseColor(copy.brand.colors[mode][token]) ?? copy.brand.colors[mode][token];
    }
  }
  return copy;
}

export const sameIdentity = (a, b) => JSON.stringify(stripSchema(a)) === JSON.stringify(stripSchema(b));
