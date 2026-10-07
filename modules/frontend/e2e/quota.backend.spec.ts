import { expect, test, type Browser, type Page } from "@playwright/test";
import { uniqueRecordNumber } from "./support/recordNumber";

/**
 * Cupo de historias contra el backend real (tarea 2.4 de add-record-quota): un ADMIN asigna un
 * cupo de 1 a un tratante recién registrado; tras crear una historia ya no puede crear otra.
 * Necesita backend + PostgreSQL y una cuenta ADMIN existente:
 * `E2E_BACKEND=1 E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… pnpm test:e2e`.
 */
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
test.skip(!process.env.E2E_BACKEND || !ADMIN_EMAIL || !ADMIN_PASSWORD, "Necesita backend, PostgreSQL y E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD");

const PASSWORD = "password123";
const QUOTA_FULL = "Alcanzaste el máximo de 1 historia clínica. Comunícate con el administrador para solicitar más.";

async function registerTratante(browser: Browser, fullName: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  const email = `e2e-cupo-${Date.now()}-${Math.floor(Math.random() * 1e6)}@empresa.test`;
  await page.goto("/registro");
  await page.getByLabel("Nombre completo").fill(fullName);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByRole("textbox", { name: "Contraseña", exact: true }).fill(PASSWORD);
  await page.getByRole("textbox", { name: "Confirmar contraseña" }).fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).not.toHaveURL(/\/(ingresar|registro)/);
  return page;
}

async function loginAdmin(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto("/ingresar");
  await page.getByLabel(/correo/i).fill(ADMIN_EMAIL!);
  await page.getByLabel(/^contraseña$/i).fill(ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).not.toHaveURL(/\/(ingresar|registro)/);
  return page;
}

/** El listado ordena por id: la cuenta recién creada está en la última página. */
async function userRow(page: Page, fullName: string) {
  await page.goto("/usuarios");
  await expect(page.getByRole("heading", { name: "Usuarios" })).toBeVisible();
  const next = page.getByRole("button", { name: "Siguiente" });
  while (await next.isEnabled()) {
    const label = await page.getByText(/^Página \d+ de \d+$/).textContent();
    await next.click();
    await expect(page.getByText(/^Página \d+ de \d+$/)).not.toHaveText(label ?? "");
  }
  return page.getByRole("row", { name: new RegExp(fullName) });
}

test("con el cupo lleno el tratante no puede crear más historias", async ({ browser }) => {
  const fullName = `Dra. Cupo ${Date.now()}`;
  const tratante = await registerTratante(browser, fullName);

  // ADMIN: la cuenta nueva nace con el cupo inicial; se confirma en 1 desde el diálogo
  const admin = await loginAdmin(browser);
  let row = await userRow(admin, fullName);
  // Cupo inicial de las cuentas nuevas (RECORDS_DEFAULT_QUOTA, 1 por defecto).
  await expect(row).toContainText("0 de 1");
  await row.getByRole("button", { name: `Cambiar el cupo de historias de ${fullName}` }).click();
  const dialog = admin.getByRole("dialog");
  await dialog.getByRole("checkbox", { name: "Sin límite" }).uncheck();
  await dialog.getByLabel("Máximo de historias").fill("1");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(row).toContainText("0 de 1");

  // Tratante: crea su única historia
  await tratante.goto("/historias");
  await expect(tratante.getByText("0 de 1 historias")).toBeVisible();
  await tratante.getByRole("link", { name: /Nueva historia/ }).first().click();
  await tratante.getByRole("textbox", { name: "Nro. de historia" }).fill(uniqueRecordNumber());
  await tratante.getByRole("textbox", { name: "Paciente" }).fill("Paciente de cupo");
  await tratante.getByRole("button", { name: /Crear historia/ }).click();
  await expect(tratante).toHaveURL(/\/historias\/\d+\?paso=2$/);

  // Listado: cupo lleno, botón deshabilitado y aviso visible
  await tratante.goto("/historias");
  await expect(tratante.getByText("1 de 1 historias")).toBeVisible();
  await expect(tratante.getByText(QUOTA_FULL)).toBeVisible();
  await expect(tratante.getByRole("link", { name: /Nueva historia/ }).first()).toHaveAttribute("aria-disabled", "true");

  // Abrir /historias/nueva directamente: aviso desde el inicio y "Crear historia" deshabilitado
  await tratante.goto("/historias/nueva");
  await expect(tratante.getByText(QUOTA_FULL)).toBeVisible();
  await expect(tratante.getByRole("button", { name: /Crear historia/ })).toBeDisabled();

  // La historia existente se sigue pudiendo abrir
  await tratante.goto("/historias");
  await tratante.getByRole("link", { name: /Editar historia/ }).first().click();
  await expect(tratante.getByRole("textbox", { name: "Paciente" })).toHaveValue("Paciente de cupo");

  // ADMIN: la fila refleja el uso
  row = await userRow(admin, fullName);
  await expect(row).toContainText("1 de 1");
});
