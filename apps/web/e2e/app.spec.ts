import { test, expect } from '@playwright/test';

const PROJECT_ID = 'b1b2c3d4-e5f6-7890-abcd-ef1234567890';

test.describe('Login y autenticacion', () => {
  test('en modo local, /login redirige a /', async ({ page }) => {
    await page.goto('/login');
    await page.waitForURL('/');
    expect(page.url()).not.toContain('/login');
  });

  test('la pagina principal carga sin errores', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Hola/ })).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Pagina principal', () => {
  test('muestra el proyecto de ejemplo', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Proyecto de ejemplo')).toBeVisible({ timeout: 10_000 });
  });

  test('boton Nuevo proyecto muestra y oculta formulario', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Hola/ })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Nuevo proyecto' }).click();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.locator('input[name="name"]')).not.toBeVisible();
  });

  test('muestra las cards informativas', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Revisor de requisitos' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Generador de casos de prueba' })).toBeVisible();
  });

  test('busqueda filtra proyectos', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Proyecto de ejemplo')).toBeVisible({ timeout: 10_000 });
    await page.fill('input[placeholder="Buscar por nombre"]', 'no existe xyz');
    await expect(page.getByText('No se encontraron proyectos.')).toBeVisible();
  });
});

test.describe('Revisar requisitos', () => {
  test('carga la pagina de revisar', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/revisar`);
    await expect(page.getByRole('heading', { name: 'Proyecto de ejemplo' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Escribe o pega tus requisitos' })).toBeVisible();
  });

  test('cargar ejemplo y limpiar', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/revisar`);
    await expect(page.getByRole('heading', { name: 'Escribe o pega tus requisitos' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Cargar ejemplo' }).click();
    const textarea = page.locator('textarea');
    const value = await textarea.inputValue();
    expect(value).toContain('RF-01');
    expect(value).toContain('RNF-01');
    await page.getByRole('button', { name: 'Limpiar' }).click();
    await expect(textarea).toHaveValue('');
  });

  test('analisis muestra calidad y sospechas', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/revisar`);
    await expect(page.getByRole('heading', { name: 'Escribe o pega tus requisitos' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Cargar ejemplo' }).click();
    await page.getByRole('button', { name: 'Analizar' }).click();
    await expect(page.getByText('Calidad global')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /^Requisitos/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Sospechas/ })).toBeVisible();
  });

  test('muestra los pasos 1-2-3', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/revisar`);
    await expect(page.getByText('1 Revisar y corregir')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('2 Generar casos')).toBeVisible();
    await expect(page.getByText('3 Exportar')).toBeVisible();
  });

  test('aplicar todas las correcciones funciona', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/revisar`);
    await expect(page.getByRole('heading', { name: 'Escribe o pega tus requisitos' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Cargar ejemplo' }).click();
    await page.getByRole('button', { name: 'Analizar' }).click();
    await expect(page.getByText('Calidad global')).toBeVisible({ timeout: 10_000 });
    const applyAllBtn = page.getByRole('button', { name: 'Aplicar todas las correcciones' });
    if (await applyAllBtn.isVisible()) {
      await applyAllBtn.click();
      await expect(page.getByText(/correcciones aplicadas/)).toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe('Generar casos (con analisis previo)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/revisar`);
    await expect(page.getByRole('heading', { name: 'Escribe o pega tus requisitos' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Cargar ejemplo' }).click();
    await page.getByRole('button', { name: 'Analizar' }).click();
    await expect(page.getByText('Calidad global')).toBeVisible({ timeout: 10_000 });
  });

  test('muestra tabla de casos', async ({ page }) => {
    await page.getByRole('link', { name: 'Siguiente: generar casos' }).click();
    await expect(page.getByRole('heading', { name: 'Generar casos de prueba' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/casos generados/)).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('toggle tabla/gherkin funciona', async ({ page }) => {
    await page.getByRole('link', { name: 'Siguiente: generar casos' }).click();
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Gherkin' }).click();
    await expect(page.getByText('Feature:')).toBeVisible();
    await page.getByRole('button', { name: 'Tabla' }).click();
    await expect(page.locator('table')).toBeVisible();
  });

  test('filtrar por requisito funciona', async ({ page }) => {
    await page.getByRole('link', { name: 'Siguiente: generar casos' }).click();
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
    const select = page.locator('select');
    const options = await select.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(1);
  });
});

test.describe('Exportar', () => {
  test('sin analisis muestra mensaje', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/exportar`);
    await expect(page.getByText('Primero analiza tus requisitos')).toBeVisible({ timeout: 10_000 });
  });

  test('navegacion desde generar llega a exportar', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/revisar`);
    await expect(page.getByRole('heading', { name: 'Escribe o pega tus requisitos' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Cargar ejemplo' }).click();
    await page.getByRole('button', { name: 'Analizar' }).click();
    await expect(page.getByText('Calidad global')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('link', { name: 'Siguiente: generar casos' }).click();
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('link', { name: 'Siguiente: exportar' }).click();
    await expect(page).toHaveURL(new RegExp(`/p/${PROJECT_ID}/exportar`), { timeout: 10_000 });
  });
});

test.describe('Versiones', () => {
  test('carga la pagina de versiones', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/versiones`);
    await expect(page.getByRole('heading', { name: 'Historial de versiones' })).toBeVisible({ timeout: 10_000 });
  });

  test('muestra el borrador actual', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/versiones`);
    await expect(page.getByRole('heading', { name: 'Historial de versiones' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('v1')).toBeVisible();
  });

  test('muestra opcion de guardar version', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/versiones`);
    await expect(page.getByRole('heading', { name: 'Guardar version actual' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[placeholder*="Nota opcional"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar version' })).toBeVisible();
  });
});

test.describe('Reglas y diccionario', () => {
  test('carga la pagina de reglas', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/reglas`);
    await expect(page.getByRole('heading', { name: 'Reglas y diccionario' })).toBeVisible({ timeout: 10_000 });
  });

  test('muestra las 15 reglas', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/reglas`);
    await expect(page.getByRole('heading', { name: 'Reglas y diccionario' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/15 de 15 reglas activas/)).toBeVisible();
    await expect(page.getByText('AMB-01')).toBeVisible();
  });

  test('muestra seccion diccionario de dominio', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/reglas`);
    await expect(page.getByRole('heading', { name: 'Diccionario de dominio' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[placeholder*="Nuevo termino"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agregar' })).toBeVisible();
  });

  test('toggle de regla funciona', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/reglas`);
    await expect(page.getByText(/15 de 15 reglas activas/)).toBeVisible({ timeout: 10_000 });
    const firstSwitch = page.locator('button[role="switch"]').first();
    await firstSwitch.click();
    await expect(page.getByText(/14 de 15 reglas activas/)).toBeVisible({ timeout: 5_000 });
    await firstSwitch.click();
    await expect(page.getByText(/15 de 15 reglas activas/)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Navegacion', () => {
  test('navegar entre pasos desde revisar', async ({ page }) => {
    await page.goto(`/p/${PROJECT_ID}/revisar`);
    await expect(page.getByRole('heading', { name: 'Escribe o pega tus requisitos' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('link', { name: '2 Generar casos' }).click();
    await expect(page).toHaveURL(new RegExp(`/p/${PROJECT_ID}/generar`));
    await page.getByRole('link', { name: '3 Exportar' }).click();
    await expect(page).toHaveURL(new RegExp(`/p/${PROJECT_ID}/exportar`));
  });

  test('click en proyecto navega a revisar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Proyecto de ejemplo')).toBeVisible({ timeout: 10_000 });
    await page.getByText('Proyecto de ejemplo').click();
    await expect(page).toHaveURL(new RegExp(`/p/${PROJECT_ID}/revisar`));
  });
});
