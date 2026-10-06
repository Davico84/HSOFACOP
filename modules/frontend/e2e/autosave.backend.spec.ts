import { expect, test } from "@playwright/test";

/**
 * Autoguardado y retomar en el último paso contra el backend real (tarea 3.4 de
 * update-orthodontic-records-autosave). Necesita backend + PostgreSQL: `E2E_BACKEND=1 pnpm test:e2e`.
 */
test.skip(!process.env.E2E_BACKEND, "Necesita backend y PostgreSQL: E2E_BACKEND=1 pnpm test:e2e");

const PASSWORD = "password123";

test("lo escrito se autoguarda y la historia se retoma en el último paso trabajado", async ({ page }) => {
  const email = `e2e-auto-${Date.now()}-${Math.floor(Math.random() * 1e6)}@empresa.test`;
  await page.goto("/registro");
  await page.getByLabel("Nombre completo").fill("Dra. María Torres");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByRole("textbox", { name: "Contraseña", exact: true }).fill(PASSWORD);
  await page.getByRole("textbox", { name: "Confirmar contraseña" }).fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).not.toHaveURL(/\/(ingresar|registro)/);

  // Crear y pasar al paso 3 (Análisis funcional) con un cambio: queda como último paso.
  await page.goto("/historias/nueva");
  await page.getByRole("textbox", { name: "Paciente" }).fill("Paciente de autoguardado");
  await page.getByRole("button", { name: /Crear historia/ }).click();
  await expect(page).toHaveURL(/\/historias\/\d+\?paso=2$/);
  const id = page.url().match(/\/historias\/(\d+)/)?.[1];
  await page.getByLabel("Observaciones (tercios)").fill("Tercio inferior aumentado");
  await page.getByRole("button", { name: /Siguiente/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: /Análisis funcional/ })).toBeVisible();

  // Autoguardado: sin pulsar nada, a los pocos segundos queda "Guardado".
  await page.getByRole("button", { name: /Paciente y anamnesis/ }).first().click();
  await page.getByLabel("Domicilio").fill("Av. Sol 123");
  await expect(page.getByText("Cambios sin guardar")).toBeVisible();
  await expect(page.getByText("Guardado", { exact: true })).toBeVisible({ timeout: 15_000 });

  // Abrir sin paso (como desde el listado): retoma en el paso 1, donde se autoguardó, con el dato.
  await page.goto(`/historias/${id}`);
  await expect(page).toHaveURL(new RegExp(`/historias/${id}\\?paso=1$`));
  await expect(page.getByLabel("Domicilio")).toHaveValue("Av. Sol 123");

  // Cambiar de paso con cambios guarda el destino: al volver a abrir, retoma ahí.
  await page.getByLabel("Lugar de nacimiento").fill("Lima");
  await page.getByRole("button", { name: /Diagnóstico y planes/ }).first().click();
  await expect(page.getByRole("heading", { level: 2, name: /Diagnóstico y planes/ })).toBeVisible();
  await page.goto(`/historias/${id}`);
  await expect(page.getByRole("heading", { level: 2, name: /Diagnóstico y planes/ })).toBeVisible();
});
