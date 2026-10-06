import { expect, test } from "@playwright/test";

/**
 * Smoke sin backend (corre en CI): el bootstrap de sesión intenta un refresh, falla por red y
 * cae a "no autenticado". Cubre el guard de rutas privadas, la validación del login y la
 * navegación entre login y registro.
 */
test.describe("authentication — smoke sin API", () => {
  test("una ruta privada (historias clínicas) sin sesión lleva al login", async ({ page }) => {
    await page.goto("/historias");
    await expect(page).toHaveURL(/\/ingresar/);
    await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  });

  test("el login valida los campos vacíos sin llamar a la API", async ({ page }) => {
    await page.goto("/ingresar");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByText("El correo es obligatorio")).toBeVisible();
    await expect(page.getByText("La contraseña es obligatoria")).toBeVisible();
  });

  test("se navega del login al registro y de vuelta", async ({ page }) => {
    await page.goto("/ingresar");
    await page.getByRole("link", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/registro/);
    await page.getByRole("link", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL(/\/ingresar/);
  });
});
