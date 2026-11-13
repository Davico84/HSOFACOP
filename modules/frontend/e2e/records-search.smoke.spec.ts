import { expect, test } from "@playwright/test";

/**
 * Smoke sin backend (corre en CI): el texto buscado de un paciente no viaja en ninguna URL.
 * La API se simula con `page.route`; se comprueba en la red que, al buscar y al recargar, ni las
 * peticiones a la API ni la del documento llevan el texto (capacidades orthodontic-records y
 * project-foundation, change update-backend-logging-no-patient-data).
 */
const SEARCHED = "quispe-e2e";

const row = {
  id: 10,
  recordNumber: "AEO-0001",
  patientName: "Ana Quispe",
  treatingDentist: "Dra. María Torres",
  authorName: "Dra. María Torres",
  updatedAt: "2026-10-01T10:00:00Z",
  patientLocked: false,
};
const pageOf = (content: unknown[]) => ({ content, page: 0, size: 10, totalElements: content.length, totalPages: 1, last: true });
const json = (body: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

test("buscar y recargar no pone el texto en ninguna URL", async ({ page }) => {
  const urls: string[] = [];
  const searchBodies: string[] = [];
  page.on("request", (request) => urls.push(request.url()));

  await page.route("**/auth/refresh", (route) =>
    route.fulfill(json({ accessToken: "token-e2e", user: { id: 1, email: "e2e@empresa.test", role: "USER", fullName: "Dra. María Torres" } })),
  );
  await page.route("**/api/orthodontic-records/quota", (route) => route.fulfill(json({ limit: null, used: 1, reached: false })));
  await page.route("**/api/orthodontic-records/search**", (route) => {
    searchBodies.push(route.request().postData() ?? "");
    return route.fulfill(json(pageOf([row])));
  });
  await page.route(/\/api\/orthodontic-records(\?.*)?$/, (route) => route.fulfill(json(pageOf([row]))));

  await page.goto("/historias");
  await expect(page.getByRole("row", { name: /AEO-0001/ })).toBeVisible();

  await page.getByRole("searchbox", { name: "Buscar historias" }).fill(SEARCHED);
  await expect.poll(() => searchBodies.length).toBeGreaterThan(0);
  expect(searchBodies[0]).toContain(SEARCHED); // el texto sí viaja, pero en el cuerpo

  // Recargar conserva la búsqueda en la pestaña, no en la dirección.
  await page.reload();
  await expect(page.getByRole("searchbox", { name: "Buscar historias" })).toHaveValue(SEARCHED);
  expect(new URL(page.url()).search).toBe("");

  expect(urls.filter((url) => url.includes(SEARCHED))).toEqual([]);
});
