import { test, expect } from '@playwright/test';
import path from 'path';

const PROJECT_ID = 'b1b2c3d4-e5f6-7890-abcd-ef1234567890';
const OUT = path.resolve(__dirname, '../../../docs/capturas');

test.use({ viewport: { width: 1280, height: 800 } });

test.describe.serial('Capturas para el manual', () => {
  test('01 - Login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForURL('/');
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '01-login.png'), fullPage: false });
  });

  test('02 - Pagina principal', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Hola/ })).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '02-inicio.png'), fullPage: true });
  });

  test('03 - Nuevo proyecto formulario', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Hola/ })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Nuevo proyecto' }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, '03-nuevo-proyecto.png'), fullPage: false });
  });

  test('04 - Revisar vacio', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/revisar`);
    await expect(page.getByRole('heading', { name: 'Escribe o pega tus requisitos' })).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '04-revisar-vacio.png'), fullPage: false });
  });

  test('05 - Revisar con ejemplo cargado', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/revisar`);
    await expect(page.getByRole('heading', { name: 'Escribe o pega tus requisitos' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Cargar ejemplo' }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '05-revisar-ejemplo.png'), fullPage: false });
  });

  test('06 - Analisis completo', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/revisar`);
    await expect(page.getByRole('heading', { name: 'Escribe o pega tus requisitos' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Cargar ejemplo' }).click();
    await page.getByRole('button', { name: 'Analizar' }).click();
    await expect(page.getByText('Calidad global')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '06-analisis-resumen.png'), fullPage: false });
  });

  test('07 - Sospechas y correcciones', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/revisar`);
    await expect(page.getByRole('heading', { name: 'Escribe o pega tus requisitos' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Cargar ejemplo' }).click();
    await page.getByRole('button', { name: 'Analizar' }).click();
    await expect(page.getByText('Calidad global')).toBeVisible({ timeout: 10_000 });
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '07-sospechas-correcciones.png'), fullPage: false });
  });

  test('08 - Analisis scroll completo', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/revisar`);
    await expect(page.getByRole('heading', { name: 'Escribe o pega tus requisitos' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Cargar ejemplo' }).click();
    await page.getByRole('button', { name: 'Analizar' }).click();
    await expect(page.getByText('Calidad global')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '08-analisis-completo.png'), fullPage: true });
  });

  test('09 - Generar casos tabla', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/revisar`);
    await expect(page.getByRole('heading', { name: 'Escribe o pega tus requisitos' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Cargar ejemplo' }).click();
    await page.getByRole('button', { name: 'Analizar' }).click();
    await expect(page.getByText('Calidad global')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('link', { name: 'Siguiente: generar casos' }).click();
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '09-generar-tabla.png'), fullPage: true });
  });

  test('10 - Generar casos gherkin', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/revisar`);
    await expect(page.getByRole('heading', { name: 'Escribe o pega tus requisitos' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Cargar ejemplo' }).click();
    await page.getByRole('button', { name: 'Analizar' }).click();
    await expect(page.getByText('Calidad global')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('link', { name: 'Siguiente: generar casos' }).click();
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Gherkin' }).click();
    await expect(page.getByText('Feature:')).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '10-generar-gherkin.png'), fullPage: false });
  });

  test('11 - Exportar', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/revisar`);
    await expect(page.getByRole('heading', { name: 'Escribe o pega tus requisitos' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Cargar ejemplo' }).click();
    await page.getByRole('button', { name: 'Analizar' }).click();
    await expect(page.getByText('Calidad global')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('link', { name: 'Siguiente: generar casos' }).click();
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('link', { name: 'Siguiente: exportar' }).click();
    await page.waitForURL(new RegExp(`/p/${PROJECT_ID}/exportar`), { timeout: 10_000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT, '11-exportar.png'), fullPage: true });
  });

  test('12 - Versiones', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/versiones`);
    await expect(page.getByRole('heading', { name: 'Historial de versiones' })).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '12-versiones.png'), fullPage: true });
  });

  test('13 - Reglas', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/reglas`);
    await expect(page.getByRole('heading', { name: 'Reglas y diccionario' })).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '13-reglas.png'), fullPage: false });
  });

  test('14 - Reglas scroll completo', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/reglas`);
    await expect(page.getByRole('heading', { name: 'Reglas y diccionario' })).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '14-reglas-completo.png'), fullPage: true });
  });
});
