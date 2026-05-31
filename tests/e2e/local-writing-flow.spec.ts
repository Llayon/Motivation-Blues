import { expect, test, type Page } from '@playwright/test';

async function startLocalMode(page: Page) {
  await page.goto('/');

  const localMode = page.getByTestId('start-local-mode');
  if (await localMode.isVisible({ timeout: 12_000 }).catch(() => false)) {
    await localMode.click();
  } else {
    await page.getByPlaceholder('author@example.com').fill('local@author.test');
    await page.getByRole('button', { name: 'Начать сезон' }).click();
  }

  await expect(page.getByText(/Local .*local@author\.test|Local .*author/i)).toBeVisible();
}

async function openEditor(page: Page) {
  await page.getByRole('button', { name: 'Редактор', exact: true }).click();
  await expect(page.getByTestId('editor-content')).toBeVisible();
}

async function writePost(page: Page, index: number) {
  await page.getByTestId('editor-title').fill(`Пост автотеста ${index}`);
  await page
    .getByTestId('editor-content')
    .fill(`Текст автотеста ${index}. Это готовый пост для проверки банка и капсул.`);
  await page.getByTestId('editor-tags').fill('autotest, flow');
  await expect(page.getByTestId('autosave-status')).toContainText(/Сохранено локально|автосейв/i);
}

test('IndexedDB autosave restores active editor buffer after reload', async ({ page }) => {
  await startLocalMode(page);
  await openEditor(page);

  await page.getByTestId('editor-title').fill('Незаконченный пост');
  await page
    .getByTestId('editor-content')
    .fill('Этот текст должен пережить перезагрузку страницы до последней запятой, вот так.');
  await page.getByTestId('editor-tags').fill('autosave, recovery');
  await expect(page.getByTestId('autosave-status')).toContainText('Сохранено локально');

  await page.reload();
  await expect(page.getByTestId('editor-content')).toBeVisible();
  await expect(page.getByTestId('editor-title')).toHaveValue('Незаконченный пост');
  await expect(page.getByTestId('editor-content')).toHaveValue(
    'Этот текст должен пережить перезагрузку страницы до последней запятой, вот так.'
  );
  await expect(page.getByTestId('editor-tags')).toHaveValue('autosave, recovery');
});

test('local writing loop banks posts, creates capsule, opens collectible, and exports text', async ({
  page
}) => {
  await startLocalMode(page);
  await openEditor(page);

  await writePost(page, 1);
  await page.getByTestId('bank-post').click();
  await page.getByRole('button', { name: 'Кабинет', exact: true }).click();
  await expect(page.getByText('1/100 постов в банке')).toBeVisible();

  await openEditor(page);
  await writePost(page, 2);
  await page.getByTestId('bank-post').click();
  await page.getByRole('button', { name: 'Кабинет', exact: true }).click();
  await expect(page.getByText('2/100 постов в банке')).toBeVisible();

  await page.getByRole('button', { name: 'Капсулы', exact: true }).click();
  await expect(page.getByTestId('sealed-capsule')).toHaveCount(1);
  await page.getByTestId('open-capsule').click();
  await expect(page.getByTestId('revealed-item')).toBeVisible();

  await page.getByRole('button', { name: 'Полка', exact: true }).click();
  await expect(page.getByTestId('owned-collectible')).toHaveCount(1);

  await page.getByRole('button', { name: 'Экспорт', exact: true }).click();
  await expect(page.getByTestId('export-preview')).toContainText('Пост автотеста 1');
  await expect(page.getByTestId('export-preview')).toContainText('Пост автотеста 2');
});
