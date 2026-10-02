import { expect, test, type Page } from "@playwright/test";

/**
 * Flujo real de historias clínicas contra el backend (tarea 6.5 de add-orthodontic-records):
 * registrarse → crear una historia → llenar varios pasos → abrir la impresión → PDF A4.
 * Necesita backend + PostgreSQL levantados (no corre en CI): `E2E_BACKEND=1 pnpm test:e2e`.
 */
test.skip(!process.env.E2E_BACKEND, "Necesita backend y PostgreSQL: E2E_BACKEND=1 pnpm test:e2e");

const PASSWORD = "password123";

async function registerAndEnter(page: Page) {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@empresa.test`;
  await page.goto("/auth/register");
  await page.getByLabel("Nombre completo").fill("Dra. María Torres");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByRole("textbox", { name: "Contraseña", exact: true }).fill(PASSWORD);
  await page.getByRole("textbox", { name: "Confirmar contraseña" }).fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).not.toHaveURL(/\/auth\//);
}

const stepHeading = (page: Page, title: RegExp) => page.getByRole("heading", { level: 2, name: title });

test("crear, llenar e imprimir una historia clínica", async ({ page }) => {
  // La vista de impresión lanza window.print(): en el test no se abre el diálogo.
  await page.addInitScript(() => {
    window.print = () => undefined;
  });
  await registerAndEnter(page);

  // Menú → listado vacío → nueva historia
  await page.getByRole("link", { name: "Historias clínicas" }).first().click();
  await expect(page.getByText("Todavía no hay historias clínicas.")).toBeVisible();
  await page.getByRole("link", { name: /Nueva historia/ }).first().click();

  // Paso 1: paciente; se crea al avanzar y pasa a su URL en el paso 2
  await page.getByRole("textbox", { name: "Paciente" }).fill("Ana Lucía Quispe Mamani");
  await page.getByRole("radio", { name: "Femenino" }).check();
  await page.getByLabel("Fecha de nacimiento").fill("2012-05-20");
  await page.getByLabel("Fecha de inicio de tratamiento").fill("2026-05-19");
  await expect(page.getByLabel("Edad")).toHaveValue("13 años");
  await page.getByRole("radio", { name: "DNI" }).check();
  await page.getByLabel("Número").fill("74125896");
  await page.getByRole("button", { name: /Crear historia/ }).click();
  await expect(stepHeading(page, /Análisis facial/)).toBeVisible();
  await expect(page).toHaveURL(/\/historias\/\d+\?paso=2$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Historia AEO-001");

  // Paso 2: análisis facial (tarjetas con imagen y presenta/no presenta + texto)
  await page.getByRole("radio", { name: "Mesofacial" }).check();
  await page.getByRole("radio", { name: "No presenta" }).first().check();
  await page.getByLabel("Observaciones (tercios)").fill("Tercio inferior aumentado");
  await page.getByRole("button", { name: /Siguiente/ }).click();
  await expect(stepHeading(page, /Análisis funcional/)).toBeVisible();

  // Paso 3: bruxismo con piezas
  await page.getByRole("radio", { name: "Sí, con presencia de desgastes" }).check();
  await page.getByRole("checkbox", { name: "Pieza 26" }).check({ force: true });
  await page.getByRole("checkbox", { name: "Pieza 13" }).check({ force: true });

  // Saltar al paso 6 desde el indicador (guarda antes) y armar la lista de problemas
  await page.getByRole("button", { name: /Diagnóstico y planes/ }).click();
  await expect(stepHeading(page, /Diagnóstico y planes/)).toBeVisible();
  const problem = page.getByPlaceholder("Nuevo problema");
  await problem.fill("Overjet aumentado");
  await problem.press("Enter");
  await problem.fill("Mordida profunda");
  await problem.press("Enter");
  await page.getByRole("button", { name: /Guardar/ }).click();
  await expect(page.getByText(/Cambios sin guardar/)).toHaveCount(0);

  // Listado: aparece la historia
  const id = page.url().match(/\/historias\/(\d+)/)?.[1];
  await page.goto("/historias");
  await expect(page.getByRole("row", { name: /AEO-001/ })).toContainText("Ana Lucía Quispe Mamani");

  // Impresión: hojas A4 con los datos y PDF real
  await page.goto(`/historias/${id}/imprimir`);
  await expect(page.getByRole("article")).toHaveCount(8);
  await expect(page.getByText("13, 26")).toBeVisible();
  await expect(page.getByText("1. Overjet aumentado")).toBeVisible();
  await page.emulateMedia({ media: "print" });
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: false });
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  expect(pages).toBe(8);
});
