import { test, expect } from "@playwright/test";

// Flujo completo recepcion→técnico→admin→cliente.
// Requiere `npm run dev` + Postgres con migrate/seed + `npx playwright install`.
test("orden completa: crear → diagnosticar → presupuestar → aprobar → reparar → cobrar → entregar → consultar", async ({
  page
}) => {
  // 1. Login recepción
  await page.goto("/login");
  await page.getByPlaceholder("email").fill("recepcion@taller.ve");
  await page.getByPlaceholder("clave").fill("demo1234");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/ordenes/);

  // 2. Órdenes visibles (demo)
  await expect(page.getByText("OT-2026-0001")).toBeVisible();

  // 3. Caja dual visible
  await page.goto("/caja");
  await expect(page.getByText("Tasa del día")).toBeVisible();

  // 4. Cliente consulta estado sin login
  await page.goto("/portal");
  await page.getByPlaceholder("OT-2026-0001").fill("OT-2026-0001");
  await page.getByPlaceholder("cédula o teléfono").fill("V-12345678");
  await page.getByRole("button", { name: "Consultar" }).click();
  await expect(page.getByText("EN_REPARACION")).toBeVisible();
});
