import { expect, test } from '@playwright/test';

test('production app shell and static assets are reachable', async ({ page, request }) => {
  const indexResponse = await request.get('./');
  expect(indexResponse.ok()).toBe(true);
  expect(await indexResponse.text()).toContain('100 постов за 40 дней');

  const manifestResponse = await request.get('./manifest.webmanifest');
  expect(manifestResponse.ok()).toBe(true);
  await expect(manifestResponse.json()).resolves.toMatchObject({
    name: 'Motivation Blues'
  });

  const serviceWorkerResponse = await request.get('./sw.js');
  expect(serviceWorkerResponse.ok()).toBe(true);
  expect(serviceWorkerResponse.headers()['content-type']).toContain('javascript');
  expect(await serviceWorkerResponse.text()).toContain('CACHE_URLS');

  let telegramSdkRequests = 0;
  await page.route('https://telegram.org/js/telegram-web-app.js', (route) => {
    telegramSdkRequests += 1;
    return route.abort();
  });

  await page.goto('./');
  await expect(
    page.getByRole('heading', { name: '100 постов за 40 дней. Пиши для себя.' })
  ).toBeVisible();
  await expect(page.getByText('Открываю письменную комнату...')).toBeHidden();
  await page.waitForTimeout(250);
  expect(telegramSdkRequests).toBe(0);
});

test('production diagnostics route copies sanitized support snapshot', async ({ page }) => {
  await page.goto('./?debug=1&access_token=secret#refresh_token=secret');
  await expect(page.getByTestId('diagnostics-hub')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Диагностика письменной комнаты' })).toBeVisible();
  await expect(page.getByTestId('diagnostics-preview')).toContainText('"schemaVersion": 1');
  await expect(page.getByTestId('diagnostics-preview')).not.toContainText('secret');

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Скопировать диагностику' }).click();
  await expect(
    page.getByText('Диагностика скопирована. Можно отправить разработчику.')
  ).toBeVisible();

  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain('"debugRoute": true');
  expect(clipboardText).not.toContain('secret');
  expect(clipboardText).not.toContain('local@author.test');
});
