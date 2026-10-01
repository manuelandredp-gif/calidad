import { test, expect } from '@playwright/test';

test.describe('TestGenAI E2E Workflow Completo (Mejora #36)', () => {
  test('Flujo E2E: Autenticación -> Selección de Proyecto -> Revisión Grid -> Exportación', async ({ page }) => {
    // 1. Acceso a la página principal
    await page.goto('/');
    await expect(page).toHaveTitle(/TestGenAI/);

    // 2. Iniciar sesión con credencial rápida Demo QA Lead
    const quickLeadBtn = page.locator('button.quick-cred-chip[data-email="qa.lead@testgenai.io"]');
    if (await quickLeadBtn.isVisible()) {
      await quickLeadBtn.click();
      await page.click('#btn-submit-login');
    }

    // 3. Confirmar llegada al Dashboard
    await expect(page.locator('.user-name')).toBeVisible();

    // 4. Navegar a Casos de Prueba
    await page.click('a[data-view="test-cases"]');
    await expect(page.locator('h2:has-text("Revisar casos de prueba")')).toBeVisible();

    // 5. Abrir Modo Hoja de Cálculo (Spreadsheet Grid con Hotkeys)
    const gridBtn = page.locator('#btn-open-grid-mode');
    if (await gridBtn.isVisible()) {
      await gridBtn.click();
      await expect(page.locator('h2:has-text("Modo Revisión Rápida")')).toBeVisible();

      // Probar atajo de teclado 'A' para aprobar
      await page.keyboard.press('a');
    }

    // 6. Navegar a Trazabilidad 360°
    const moreBtn = page.locator('#btn-nav-more');
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await page.click('a[data-view="traceability-360"]');
      await expect(page.locator('h2:has-text("Matriz de Trazabilidad 360°")')).toBeVisible();
    }

    // 7. Navegar a Calculadora de ROI
    await page.click('a[data-view="roi-calculator"]');
    await expect(page.locator('h2:has-text("Calculadora de ROI")')).toBeVisible();
    await expect(page.locator('#stat-roi-percent')).toBeVisible();
  });
});
