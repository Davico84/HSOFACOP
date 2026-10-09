// Scenarios de template-bootstrap → "Aplicación segura de la configuración".
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { applyProject } from "./apply.mjs";
import { REPO_ROOT, acme, editConfig, hashFiles, makeRepoCopy, read, trackedFiles, write } from "./support/repo-copy.mjs";

// Identidad aplicada en el repo real (no se escribe a mano: la plantilla puede estar neutralizada).
const ORIGINAL = JSON.parse(read(REPO_ROOT, ".template/applied.json"));

const SECRETS = "modules/backend/secrets.properties";
const ENV = "modules/frontend/.env";

/** Ejecuta `fn(root)` sobre una copia limpia del repo y la borra al final. */
function withCopy(fn) {
  const { root, cleanup } = makeRepoCopy();
  try {
    return fn(root);
  } finally {
    cleanup();
  }
}

const commitAll = (root) => {
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-q", "-m", "fixture"], { cwd: root });
};

const blockOf = (css, index) => [...css.matchAll(/@template:brand[\s\S]*?@end-template:brand/g)][index][0];

test("Identidad visible, contrato y documentación", () =>
  withCopy((root) => {
    const contractBefore = read(root, "contracts/openapi.json");
    editConfig(root, acme);
    applyProject(root, {});

    const yml = read(root, "modules/backend/src/main/resources/application.yml");
    assert.match(yml, /^ {2}name: "Acme CRM"$/m);
    assert.match(yml, /^ {2}description: "Plataforma de gestión de clientes de Acme\."$/m);

    const contract = JSON.parse(read(root, "contracts/openapi.json"));
    assert.equal(contract.info.title, "Acme CRM API");
    assert.equal(contract.info.description, "Plataforma de gestión de clientes de Acme.");
    // Fuera de `info`, el contrato queda igual byte a byte (orden de respuestas "200", "404"… incluido).
    const withoutInfo = (text) => text.replace(/"info"\s*:\s*\{[^}]*\}/, '"info": {}');
    assert.equal(withoutInfo(read(root, "contracts/openapi.json")), withoutInfo(contractBefore));
    const header = read(root, "modules/frontend/src/modules/core/services/generated/auth.ts");
    assert.match(header, /^ \* Acme CRM API$/m);
    assert.match(header, /^ \* Plataforma de gestión de clientes de Acme\.$/m);

    assert.match(read(root, "modules/backend/pom.xml"), /<description>Acme CRM - backend<\/description>/);
    assert.equal(JSON.parse(read(root, "package.json")).description, "Acme CRM - raíz del monorepo (hooks y calidad de commits)");

    for (const doc of ["readme.md", "CLAUDE.md", "docs/frontend.md", "openspec/config.yaml"]) {
      const text = read(root, doc);
      assert.ok(text.includes("Acme CRM"), `${doc} debe usar el nuevo nombre`);
      assert.ok(!text.includes(ORIGINAL.name), `${doc} no debe conservar el nombre anterior`);
    }
    // Historial y changes activos no se tocan.
    const archived = trackedFiles(root).find((f) => f.startsWith("openspec/changes/archive/") && f.endsWith("proposal.md"));
    assert.ok(read(root, archived).length > 0);
  }));

test("Identificadores técnicos intactos", () =>
  withCopy((root) => {
    const javaFiles = trackedFiles(root).filter((f) => f.startsWith("modules/backend/src/") && f.endsWith(".java"));
    const snapshot = () => {
      const pom = read(root, "modules/backend/pom.xml");
      const docs = ["readme.md", "docs/tooling-setup.md", ".claude/skills/frontend-guard/SKILL.md"].map((f) => read(root, f));
      return {
        java: hashFiles(root, javaFiles),
        javaPaths: javaFiles.join("\n"),
        pomIds: pom.match(/<(groupId|artifactId|name)>[^<]*<\/\1>/g).slice(0, 6).join(),
        packageNames: [read(root, "package.json"), read(root, "modules/frontend/package.json")].map((t) => JSON.parse(t).name).join(),
        springName: read(root, "modules/backend/src/main/resources/application.yml").match(/^ {4}name: .*$/m)[0],
        orvalKey: read(root, "modules/frontend/orval.config.ts").match(/^ {2}(\w+): \{$/m)[1],
        slugInDocs: docs.map((t) => t.split("odontorisas-frontend").length - 1).join(),
      };
    };
    const before = snapshot();
    assert.ok(javaFiles.some((f) => f.endsWith("OdontorisasApplication.java")));
    editConfig(root, acme);
    applyProject(root, {});
    assert.deepEqual(snapshot(), before);
  }));

test("Base de datos y seguridad", () =>
  withCopy((root) => {
    // secrets.properties local previo: DB_NAME aún con el valor por defecto anterior (se actualiza),
    // DB_PORT/DB_URL personalizados (se conservan), comentarios, clave desconocida y secretos propios.
    const db = ORIGINAL.database;
    write(
      root,
      SECRETS,
      `# mi config local\nDB_URL=jdbc:postgresql://localhost:5435/${db.name}\nDB_NAME=${db.name}\nDB_PORT=5435\n` +
        "MI_CLAVE_PROPIA=42\nDB_PASSWORD=mi-clave\n\nJWT_SECRET=no-tocar\n",
    );
    editConfig(root, acme);
    const result = applyProject(root, {});

    const example = read(root, "modules/backend/secrets.properties.example");
    assert.match(example, /^DB_URL=jdbc:postgresql:\/\/localhost:5440\/acme$/m);
    assert.match(example, /^DB_NAME=acme$/m);
    assert.match(example, /^DB_USERNAME=acme_user$/m);
    assert.match(example, /^DB_CONTAINER_NAME=acme-db$/m);
    assert.match(example, /^JWT_ISSUER=acme-crm$/m);
    const compose = read(root, "modules/backend/compose.yaml");
    assert.match(compose, /^name: \$\{DB_CONTAINER_NAME:-acme-db\}$/m, "nombre de proyecto propio → volumen propio");
    assert.match(compose, /container_name: \$\{DB_CONTAINER_NAME:-acme-db\}/);
    assert.match(compose, /\$\{DB_PORT:-5440\}/);
    assert.match(read(root, "modules/backend/src/main/resources/application.yml"), /issuer: \$\{JWT_ISSUER:acme-crm\}/);

    const secrets = read(root, SECRETS);
    const lines = secrets.split("\n");
    assert.equal(lines[0], "# mi config local");
    assert.equal(lines[1], `DB_URL=jdbc:postgresql://localhost:5435/${db.name}`, "personalizado: se conserva");
    assert.equal(lines[2], "DB_NAME=acme", "tenía el valor por defecto anterior: se actualiza (orden conservado)");
    assert.equal(lines[3], "DB_PORT=5435", "personalizado: se conserva");
    assert.ok(secrets.includes("MI_CLAVE_PROPIA=42"));
    assert.ok(secrets.includes("DB_PASSWORD=mi-clave"));
    assert.ok(secrets.includes("JWT_SECRET=no-tocar"));
    assert.match(secrets, /^DB_USERNAME=acme_user$/m); // clave gestionada que faltaba: añadida
    assert.deepEqual(
      result.keptLocal.map((k) => k.key).sort(),
      ["DB_PORT", "DB_URL"],
      "informa de los valores locales que conserva",
    );
  }));

test("Secretos locales inexistentes", () =>
  withCopy((root) => {
    assert.ok(!existsSync(path.join(root, SECRETS)));
    applyProject(root, {}); // sin cambios de identidad: igualmente crea los locales
    const secrets = read(root, SECRETS);
    const jwt = secrets.match(/^JWT_SECRET=(.*)$/m)[1];
    assert.notEqual(jwt, "cambia-este-secreto-largo-y-aleatorio");
    assert.ok(jwt.length >= 60, "JWT_SECRET aleatorio de 48 bytes en base64");
    assert.ok(secrets.includes(`DB_NAME=${ORIGINAL.database.name}`));
    assert.ok(existsSync(path.join(root, ENV)));
    assert.equal(read(root, ENV), read(root, "modules/frontend/.env.example"));
  }));

test("SWAGGER_ENABLED: se conserva en un secrets.properties existente", () =>
  withCopy((root) => {
    write(root, SECRETS, "DB_PASSWORD=mi-clave\nJWT_SECRET=no-tocar\nSWAGGER_ENABLED=false\n");
    editConfig(root, acme);
    applyProject(root, {});

    assert.match(read(root, SECRETS), /^SWAGGER_ENABLED=false$/m, "valor local conservado");
  }));

test("SWAGGER_ENABLED: viaja desde el .example al crear secrets.properties", () =>
  withCopy((root) => {
    assert.ok(!existsSync(path.join(root, SECRETS)));
    applyProject(root, {});

    assert.match(read(root, SECRETS), /^SWAGGER_ENABLED=true$/m, "en local la documentación queda encendida");
  }));

test("Colores de marca", () =>
  withCopy((root) => {
    editConfig(root, (c) => {
      c.brand.colors.light["brand-start"] = "#0D9488";
      c.brand.colors.dark.ring = "hsl(10, 20%, 30%)";
    });
    applyProject(root, {});
    const css = read(root, "modules/frontend/src/styles/globals.css");
    assert.equal((css.match(/@template:brand/g) ?? []).length, 2);
    assert.match(blockOf(css, 0), /--brand-start: #0d9488;/);
    assert.match(blockOf(css, 1), /--ring: hsl\(10 20% 30%\);/);
    for (const i of [0, 1]) {
      for (const token of ["primary", "ring", "brand-start", "brand-end"]) {
        assert.match(blockOf(css, i), new RegExp(`--${token}:`), `paridad: ${token} en el bloque ${i}`);
      }
    }
    assert.match(css, /--color-brand-start: var\(--brand-start\);/); // el @theme inline no cambia
  }));

test("Sin restos del nombre anterior", () =>
  withCopy((root) => {
    write(root, "modules/frontend/src/extra.ts", `// Hecho para ${ORIGINAL.name}\nexport const x = 1;\n`);
    commitAll(root);
    const files = trackedFiles(root).filter((f) => f !== "project.config.json");
    const before = hashFiles(root, files);
    editConfig(root, acme);
    assert.throws(
      () => applyProject(root, {}),
      (err) =>
        err.leftovers?.some((l) => l.startsWith("modules/frontend/src/extra.ts:1:")) &&
        !err.leftovers.some((l) => l.includes("V1__init.sql")), // migración aplicada: excluida
    );
    assert.equal(hashFiles(root, files), before, "no se escribe nada si quedan restos");
  }));

test("Árbol de trabajo con cambios sin commitear", () =>
  withCopy((root) => {
    write(root, "docs/vision.md", read(root, "docs/vision.md") + "\nborrador\n");
    editConfig(root, acme);
    assert.throws(() => applyProject(root, {}), /cambios sin commitear/);
    assert.equal(read(root, "contracts/openapi.json").includes("Acme"), false);

    // Solo la config (y public/brand) modificados: se permite.
    execFileSync("git", ["checkout", "--", "docs/vision.md"], { cwd: root });
    write(root, "modules/frontend/public/brand/extra.svg", "<svg/>");
    applyProject(root, {});
    assert.equal(JSON.parse(read(root, "contracts/openapi.json")).info.title, "Acme CRM API");
  }));

test("Ensayo sin escritura", () =>
  withCopy((root) => {
    editConfig(root, acme);
    const files = trackedFiles(root);
    const before = hashFiles(root, files);
    const result = applyProject(root, { dryRun: true });
    assert.ok(result.changed.includes("contracts/openapi.json"));
    assert.ok(result.local.includes(SECRETS));
    assert.equal(hashFiles(root, files), before);
    assert.ok(!existsSync(path.join(root, SECRETS)));
  }));

test("Copia sin git", () =>
  withCopy((root) => {
    rmSync(path.join(root, ".git"), { recursive: true, force: true });
    write(root, SECRETS, "DB_NAME=local\nJWT_SECRET=mio\n"); // local: no debe entrar en el recorrido de texto
    editConfig(root, acme);
    const result = applyProject(root, {});
    assert.match(result.warning, /no es un repositorio git/);
    assert.equal(JSON.parse(read(root, "contracts/openapi.json")).info.title, "Acme CRM API");
    assert.ok(read(root, "CLAUDE.md").includes("Acme CRM"));
    assert.ok(result.changed.every((f) => !f.includes("node_modules") && f !== SECRETS));
    assert.match(read(root, SECRETS), /^JWT_SECRET=mio$/m);
    assert.equal(applyProject(root, {}).noChanges, true);
  }));

test("Re-aplicar sin cambios", () =>
  withCopy((root) => {
    editConfig(root, acme);
    applyProject(root, {});
    const files = [...trackedFiles(root), SECRETS, ENV];
    const before = hashFiles(root, files);
    const again = applyProject(root, { allowDirty: true });
    assert.equal(again.noChanges, true);
    assert.deepEqual(again.changed, []);
    assert.equal(hashFiles(root, files), before);
  }));
