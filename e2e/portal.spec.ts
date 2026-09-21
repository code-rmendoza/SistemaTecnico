import { test, expect } from "@playwright/test";

// Requiere `npm run dev` + `npx playwright install` (pendiente en este entorno).
test("portal muestra timeline con código válido", async ({ page }) => {
  await page.goto("/portal");
  await page.getByPlaceholder("OT-2026-0001").fill("OT-2026-0001");
  await page.getByPlaceholder("cédula o teléfono").fill("V-12345678");
  await page.getByRole("button", { name: "Consultar" }).click();
  await expect(page.getByText("EN_REPARACION")).toBeVisible();
});

test("portal no filtra con código erróneo", async ({ page }) => {
  await page.goto("/portal");
  await page.getByPlaceholder("OT-2026-0001").fill("OT-9999-9999");
  await page.getByPlaceholder("cédula o teléfono").fill("V-12345678");
  await page.getByRole("button", { name: "Consultar" }).click();
  await expect(page.getByText("Orden no encontrada")).toBeVisible();
});
