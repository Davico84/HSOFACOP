import { expect, test, type Page } from "@playwright/test";

/**
 * Regresión responsive del módulo de historia clínica (update-orthodontic-records-responsive): a
 * 375 px (celular), 768 px (tablet) y 1280 px (escritorio), el listado, los 8 pasos (con los paneles del paso 5 abiertos)
 * y la vista previa no se desplazan de lado y dejan visibles sus acciones. Necesita backend y
 * PostgreSQL: `E2E_BACKEND=1 pnpm test:e2e`.
 */
test.skip(!process.env.E2E_BACKEND, "Necesita backend y PostgreSQL: E2E_BACKEND=1 pnpm test:e2e");

const PASSWORD = "password123";

async function registerAndEnter(page: Page, width: number) {
  await page.goto("/registro");
  await page.getByLabel("Nombre completo").fill("Dra. María Torres");
  await page.getByLabel("Correo electrónico").fill(`resp-${width}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@empresa.test`);
  await page.getByRole("textbox", { name: "Contraseña", exact: true }).fill(PASSWORD);
  await page.getByRole("textbox", { name: "Confirmar contraseña" }).fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).not.toHaveURL(/\/(ingresar|registro)/);
}

/** La página no se desplaza de lado. */
async function expectNoHorizontalScroll(page: Page, where: string) {
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(scroll, `desplazamiento horizontal en ${where}`).toBeLessThanOrEqual(client);
}

for (const width of [375, 768, 1280]) {
  test(`módulo de historia clínica usable a ${width} px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      window.print = () => undefined;
    });
    await registerAndEnter(page, width);

    await page.goto("/historias/nueva");
    await page.getByRole("textbox", { name: "Paciente" }).fill("Ana Lucía Quispe Mamani");
    await expectNoHorizontalScroll(page, "nueva historia");
    await page.getByRole("button", { name: /Crear historia/ }).click();
    await expect(page).toHaveURL(/\?paso=2$/);
    const id = page.url().match(/historias\/(\d+)/)![1];

    for (let paso = 2; paso <= 8; paso++) {
      await page.goto(`/historias/${id}?paso=${paso}`);
      await page.getByRole("heading", { level: 2 }).first().waitFor();
      // El paso actual se ve (antes de abrir paneles, que bajan la página): en escritorio, resaltado en
      // la columna lateral; en celular y tablet, "Paso N de 8" con el botón "Pasos".
      const nav = page.getByRole("navigation", { name: "Pasos de la historia clínica" });
      if (width >= 1024) {
        await expect(nav.locator('[aria-current="step"]')).toBeInViewport();
      } else {
        await expect(nav.getByText(new RegExp(`^Paso ${paso} de 8`))).toBeInViewport();
        await expect(nav.getByRole("button", { name: /Pasos/ })).toBeInViewport();
      }
      if (paso === 5) {
        for (const name of [/^Análisis de Moyers/, /^Análisis de Nance/, /^Análisis de Bolton/]) {
          await page.getByRole("button", { name }).click();
        }
      }
      await expectNoHorizontalScroll(page, `paso ${paso}`);
    }

    await page.goto("/historias");
    await expect(page.getByRole("link", { name: "Editar historia AEO-001" })).toBeInViewport();
    await expect(page.getByRole("link", { name: "Vista previa de impresión de la historia AEO-001" })).toBeInViewport();
    await expectNoHorizontalScroll(page, "listado");

    await page.goto(`/historias/${id}/imprimir`);
    await page.getByRole("article").first().waitFor();
    await expect(page.getByRole("button", { name: "Imprimir" })).toBeInViewport();
    await expectNoHorizontalScroll(page, "vista previa");

    // La impresión no cambia: aunque en pantalla las hojas se reduzcan, el PDF sale en A4 real.
    await page.emulateMedia({ media: "print" });
    const pdf = await page.pdf({ preferCSSPageSize: true });
    const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    expect(pages).toBe(13);
    // A4 = 595 × 842 pt (Chromium escribe la caja con o sin decimales).
    const box = pdf.toString("latin1").match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/);
    expect(box, "MediaBox en el PDF").not.toBeNull();
    expect(Math.round(Number(box![1]))).toBe(595);
    expect(Math.round(Number(box![2]))).toBe(842);
  });
}

test("pantalla muy ancha (2560 px): la app mide 1920 px como máximo y va centrada, con la barra junto al contenido", async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1200 });
  await registerAndEnter(page, 2560);
  await page.goto("/historias");
  await page.getByRole("heading", { level: 1 }).first().waitFor();

  const measure = async () =>
    page.evaluate(() => {
      const frame = (document.querySelector("[data-app-frame]") as HTMLElement).getBoundingClientRect();
      const sidebar = (document.getElementById("app-sidebar") as HTMLElement).getBoundingClientRect();
      const content = ((document.querySelector("main") as HTMLElement).firstElementChild as HTMLElement).getBoundingClientRect();
      return {
        frameWidth: frame.width,
        frameLeft: frame.left,
        frameRight: window.innerWidth - frame.right,
        sidebarLeft: sidebar.left,
        contentWidth: content.width,
      };
    });

  for (const state of ["expandida", "contraída"]) {
    if (state === "contraída") {
      await page.getByRole("button", { name: "Contraer barra lateral" }).click();
      await page.waitForTimeout(300);
    }
    const m = await measure();
    expect(m.frameWidth, `ancho de la app (${state})`).toBeLessThanOrEqual(1920);
    expect(Math.abs(m.frameLeft - m.frameRight), `app centrada (${state})`).toBeLessThanOrEqual(1);
    // La barra va pegada al borde del marco, no al de la pantalla.
    expect(Math.abs(m.sidebarLeft - m.frameLeft), `barra junto al marco (${state})`).toBeLessThanOrEqual(1);
    expect(m.contentWidth, `ancho del contenido (${state})`).toBeLessThanOrEqual(1536);
  }
  await expectNoHorizontalScroll(page, "2560 px");
});
