import { expect, test, type Page } from '@playwright/test';

async function startLocalMode(page: Page) {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: '100 постов за 40 дней. Пиши для себя.' })
  ).toBeVisible();
  await expect(page.getByPlaceholder('Твой лучший email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Начать марафон' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Вернуться к текстам' })).toBeVisible();

  const localMode = page.getByTestId('start-local-mode');
  if (await localMode.isVisible({ timeout: 12_000 }).catch(() => false)) {
    await localMode.click();
  } else {
    await page.getByPlaceholder('Твой лучший email').fill('local@author.test');
    await page.getByRole('button', { name: 'Начать марафон' }).click();
  }

  await expect(page.getByText(/Local .*local@author\.test|Local .*author/i)).toBeVisible();
}

async function openEditor(page: Page) {
  await page.getByRole('button', { name: 'Редактор', exact: true }).click();
  await expect(page.getByTestId('editor-content')).toBeVisible();
  await expect(page.getByPlaceholder('Как назовем?')).toBeVisible();
  await expect(page.getByPlaceholder('Рукописи не горят. Начинай...')).toBeVisible();
  await expect(page.getByPlaceholder('Теги: идеи, личное, продукт')).toBeVisible();
}

async function writePost(page: Page, index: number) {
  await writePostFields(
    page,
    `Пост автотеста ${index}`,
    `Текст автотеста ${index}. Это готовый пост для проверки банка и капсул.`,
    'autotest, flow'
  );
}

async function writePostFields(page: Page, title: string, content: string, tags: string) {
  await page.getByTestId('editor-title').fill(title);
  await page.getByTestId('editor-content').fill(content);
  await page.getByTestId('editor-tags').fill(tags);
  await expect(page.getByTestId('autosave-status')).toContainText(/Сохранено в/i);
}

async function waitForEditorBufferTags(page: Page, expectedTags: string) {
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const storage = window.localStorage.getItem('post-season-storage');
          const profileId = storage ? JSON.parse(storage).state?.profile?.id : null;

          if (!profileId) {
            return null;
          }

          try {
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
              const request = window.indexedDB.open('motivation-blues-editor-buffer', 1);
              request.onerror = () => reject(request.error);
              request.onsuccess = () => resolve(request.result);
            });
            const transaction = db.transaction('active-editor-buffers', 'readonly');
            const request = transaction.objectStore('active-editor-buffers').get(profileId);
            const record = await new Promise<{ tagsInput?: string } | undefined>(
              (resolve, reject) => {
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
              }
            );
            db.close();

            return record?.tagsInput ?? null;
          } catch {
            const fallback = window.localStorage.getItem(
              `motivation-blues-editor-buffer:${profileId}`
            );
            return fallback ? JSON.parse(fallback).tagsInput : null;
          }
        }),
      { timeout: 5_000 }
    )
    .toBe(expectedTags);
}

async function bankCurrentPost(page: Page) {
  await page.getByTestId('bank-post').click();
}

async function bankPostFromEditor(page: Page, title: string, content: string, tags: string) {
  await openEditor(page);
  await writePostFields(page, title, content, tags);
  await bankCurrentPost(page);
}

async function openBank(page: Page) {
  await page.getByRole('button', { name: 'Банк', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Готовые посты' })).toBeVisible();
}

async function expectProgress(page: Page, progress: string) {
  await page.getByRole('button', { name: 'Кабинет', exact: true }).click();
  await expect(page.getByText(progress)).toBeVisible();
}

async function expectBankCards(page: Page, count: number) {
  await expect(page.getByTestId('bank-post-card')).toHaveCount(count);
}

async function openFirstBankedPostForEdit(page: Page) {
  await openBank(page);
  await page.getByTestId('edit-banked-post').first().click();
  await expect(page.getByTestId('editor-content')).toBeVisible();
}

async function updateCurrentBankedPost(page: Page) {
  await page.getByTestId('update-banked-post').click();
  await expect(page.getByRole('heading', { name: 'Готовые посты' })).toBeVisible();
}

async function saveCurrentDraft(page: Page) {
  await page.getByTestId('save-draft').click();
  await expect(page.getByText('Убрано в стол.')).toBeVisible();
}

async function selectEditorText(page: Page, text: string) {
  const expectedSelection = await page
    .getByTestId('editor-content')
    .evaluate(async (element, targetText) => {
      const textarea = element as HTMLTextAreaElement;
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      const start = textarea.value.indexOf(targetText as string);

      if (start < 0) {
        throw new Error(`Text not found: ${targetText}`);
      }

      textarea.focus();
      textarea.setSelectionRange(start, start + String(targetText).length);
      textarea.dispatchEvent(new Event('select', { bubbles: true }));
      textarea.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      return { start, end: start + String(targetText).length };
    }, text);
  await expect
    .poll(() =>
      page.getByTestId('editor-content').evaluate((element) => {
        const textarea = element as HTMLTextAreaElement;
        return `${textarea.selectionStart}:${textarea.selectionEnd}`;
      })
    )
    .toBe(`${expectedSelection.start}:${expectedSelection.end}`);
  await expect(page.getByTestId('formatting-menu')).toBeVisible();
}

test('PWA manifest and service worker assets are available', async ({ page, request }) => {
  await page.goto('/');

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();

  const manifestResponse = await request.get(manifestHref!);
  expect(manifestResponse.ok()).toBe(true);

  const manifest = (await manifestResponse.json()) as {
    display?: string;
    start_url?: string;
    icons?: Array<{ sizes?: string; purpose?: string }>;
  };

  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('.');
  expect(manifest.icons?.some((icon) => icon.sizes === '192x192')).toBe(true);
  expect(manifest.icons?.some((icon) => icon.sizes === '512x512')).toBe(true);
  expect(manifest.icons?.some((icon) => icon.purpose === 'maskable')).toBe(true);

  const serviceWorkerResponse = await request.get('/sw.js');
  expect(serviceWorkerResponse.ok()).toBe(true);
  expect(serviceWorkerResponse.headers()['content-type']).toContain('javascript');
  expect(await serviceWorkerResponse.text()).toContain('CACHE_URLS');
});

test('cloud hydration failure still renders the static shell instead of blocking first render', async ({
  page
}) => {
  let telegramSdkRequests = 0;

  await page.route('https://telegram.org/js/telegram-web-app.js', (route) => {
    telegramSdkRequests += 1;
    return route.abort();
  });
  await page.route('**/auth/v1/**', (route) => route.abort());
  await page.route('**/rest/v1/**', (route) => route.abort());

  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: '100 постов за 40 дней. Пиши для себя.' })
  ).toBeVisible({ timeout: 2_000 });
  await expect(page.getByText('Открываю письменную комнату...')).toBeHidden();
  await page.waitForTimeout(250);
  expect(telegramSdkRequests).toBe(0);

  await page.getByTestId('start-local-mode').click();
  await expect(page.getByText(/Local .*local@author\.test|Local .*author/i)).toBeVisible();
});

test('Telegram Mini App auth starts from the static shell without root cloud blocking', async ({
  page
}) => {
  let telegramAuthRequests = 0;

  await page.route('https://telegram.org/js/telegram-web-app.js', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        window.__telegramRequestFullscreenCalls = 0;
        window.Telegram = {
          WebApp: {
            initData: 'query_id=test&user=%7B%22id%22%3A42%7D&auth_date=1700000000&hash=test',
            ready: function () {},
            expand: function () {},
            requestFullscreen: function () {
              window.__telegramRequestFullscreenCalls += 1;
            }
          }
        };
      `
    });
  });
  await page.route('**/auth/v1/**', (route) => route.abort());
  await page.route('**/rest/v1/**', (route) => route.abort());
  await page.route('**/functions/v1/telegram-auth', async (route) => {
    telegramAuthRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Telegram auth unavailable in test' })
    });
  });

  await page.goto('/?tgWebAppData=test-launch');

  await expect(
    page.getByRole('heading', { name: '100 постов за 40 дней. Пиши для себя.' })
  ).toBeVisible({ timeout: 2_000 });
  await expect(page.getByText('Открываю письменную комнату...')).toBeHidden();
  await expect.poll(() => telegramAuthRequests, { timeout: 2_000 }).toBe(1);
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (window as Window & { __telegramRequestFullscreenCalls?: number })
              .__telegramRequestFullscreenCalls ?? 0
        ),
      { timeout: 2_000 }
    )
    .toBeGreaterThan(0);
  await expect(page.getByText('Telegram auth unavailable in test')).toBeVisible();
});

test('IndexedDB autosave restores active editor buffer after reload', async ({ page }) => {
  await startLocalMode(page);
  await openEditor(page);

  await page.getByTestId('editor-title').fill('Незаконченный пост');
  await page
    .getByTestId('editor-content')
    .fill('Этот текст должен пережить перезагрузку страницы до последней запятой, вот так.');
  await page.getByTestId('editor-tags').fill('autosave, recovery');
  await expect(page.getByTestId('autosave-status')).toContainText('Сохранено в');
  await waitForEditorBufferTags(page, 'autosave, recovery');

  await page.reload();
  await expect(page.getByTestId('editor-content')).toBeVisible();
  await expect(page.getByTestId('editor-title')).toHaveValue('Незаконченный пост');
  await expect(page.getByTestId('editor-content')).toHaveValue(
    'Этот текст должен пережить перезагрузку страницы до последней запятой, вот так.'
  );
  await expect(page.getByTestId('editor-tags')).toHaveValue('autosave, recovery');
});

test('route error boundary keeps shell usable without losing editor buffer', async ({ page }) => {
  await startLocalMode(page);
  await openEditor(page);

  await writePostFields(
    page,
    'Буфер перед аварией',
    'Этот текст должен остаться в столе, даже если один раздел приложения споткнулся.',
    'error-boundary'
  );
  await waitForEditorBufferTags(page, 'error-boundary');

  await page.goto('/?__simulateRouteError=1');
  await expect(page.getByTestId('error-boundary')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Редактор', exact: true })).toBeVisible();
  await expect(page.getByText('Диагностический отчет сохранен локально')).toBeVisible();

  const crashReport = await page.evaluate(() => {
    const raw = window.localStorage.getItem('motivation-blues-crash-report');
    return raw ? JSON.parse(raw) : null;
  });
  expect(crashReport).toMatchObject({
    error: { message: 'Simulated active view crash.' },
    route: { activeView: 'editor' },
    state: { mode: 'local' }
  });

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Скопировать отчет' }).click();
  await expect(page.getByText('Отчет скопирован. Можно отправить разработчику.')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('"message": "Simulated active view crash."');

  await page.getByRole('button', { name: 'Вернуться в кабинет' }).click();
  await expect(page.getByText('0/100 постов в банке')).toBeVisible();

  await openEditor(page);
  await expect(page.getByTestId('editor-title')).toHaveValue('Буфер перед аварией');
  await expect(page.getByTestId('editor-content')).toHaveValue(
    'Этот текст должен остаться в столе, даже если один раздел приложения споткнулся.'
  );
  await expect(page.getByTestId('editor-tags')).toHaveValue('error-boundary');
});

test('editor uses literary focus copy and manuscript length statuses', async ({ page }) => {
  await startLocalMode(page);
  await openEditor(page);

  await expect(page.getByText('В столе пока пусто.')).toBeVisible();
  await expect(page.getByText('Эскиз')).toBeVisible();

  await page.getByTestId('editor-content').fill(Array(60).fill('слово').join(' '));
  await expect(page.getByText('Заметка')).toBeVisible();

  await page.getByTestId('editor-content').fill(Array(1001).fill('слово').join(' '));
  await expect(page.getByText('Толстой одобряет')).toBeVisible();
});

test('telegram formatting menu inserts markup and bank renders it safely', async ({ page }) => {
  await startLocalMode(page);
  await openEditor(page);

  await page.getByTestId('editor-title').fill('Форматированный пост');
  await page.getByTestId('editor-content').fill('жирный курсив ссылка');
  await page.getByTestId('editor-tags').fill('formatting');

  await selectEditorText(page, 'жирный');
  await page.getByTestId('format-bold').click();
  await expect(page.getByTestId('editor-content')).toHaveValue('*жирный* курсив ссылка');

  await selectEditorText(page, 'курсив');
  await page.getByTestId('format-italic').click();
  await expect(page.getByTestId('editor-content')).toHaveValue('*жирный* _курсив_ ссылка');

  await selectEditorText(page, 'ссылка');
  await page.getByTestId('format-link').click();
  await expect(page.getByTestId('editor-content')).toHaveValue(
    '*жирный* _курсив_ [ссылка](https://example.com)'
  );
  await expect(page.getByTestId('autosave-status')).toContainText('Сохранено в');

  await bankCurrentPost(page);
  await openBank(page);
  await expect(page.getByTestId('bank-post-card').locator('p strong')).toHaveText('жирный');
  await expect(page.getByTestId('bank-post-card').locator('p em')).toHaveText('курсив');
  await expect(page.getByTestId('bank-post-card').locator('p a')).toHaveAttribute(
    'href',
    'https://example.com'
  );

  await page.getByRole('button', { name: 'Экспорт', exact: true }).click();
  await expect(page.getByTestId('export-preview')).toContainText(
    '*жирный* _курсив_ [ссылка](https://example.com)'
  );
});

test('local writing loop banks posts, creates capsule, opens collectible, and exports text', async ({
  page
}) => {
  await startLocalMode(page);
  await openEditor(page);

  await writePost(page, 1);
  await bankCurrentPost(page);
  await expectProgress(page, '1/100 постов в банке');

  await openEditor(page);
  await writePost(page, 2);
  await bankCurrentPost(page);
  await expectProgress(page, '2/100 постов в банке');

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

test('banked post can be edited without adding progress or capsules', async ({ page }) => {
  await startLocalMode(page);
  await bankPostFromEditor(
    page,
    'Исходный пост',
    'Исходный текст для проверки редактирования банка.',
    'draft, original'
  );
  await expectProgress(page, '1/100 постов в банке');

  await openFirstBankedPostForEdit(page);
  await expect(page.getByText('Архив. Нет предела совершенству (Вне фокуса дня).')).toBeVisible();
  await expect(page.getByTestId('editor-title')).toHaveValue('Исходный пост');
  await page.getByTestId('editor-title').fill('Обновленный пост');
  await page
    .getByTestId('editor-content')
    .fill('Обновленный текст остается тем же banked-постом без новой награды.');
  await page.getByTestId('editor-tags').fill('edited, product');
  await updateCurrentBankedPost(page);

  await expect(page.getByText('Обновленный пост')).toBeVisible();
  await expect(
    page.getByText('Обновленный текст остается тем же banked-постом без новой награды.')
  ).toBeVisible();
  await expect(
    page.getByTestId('bank-post-card').getByRole('button', { name: '#edited' })
  ).toBeVisible();
  await expectProgress(page, '1/100 постов в банке');

  await page.getByRole('button', { name: 'Капсулы', exact: true }).click();
  await expect(page.getByTestId('sealed-capsule')).toHaveCount(0);
});

test('bank tag chips and search navigate banked posts', async ({ page }) => {
  await startLocalMode(page);
  await bankPostFromEditor(
    page,
    'Product launch',
    'Launch mechanics for a channel.',
    'product, launch'
  );
  await bankPostFromEditor(
    page,
    'Personal story',
    'Reflection about writing discipline.',
    'personal'
  );
  await bankPostFromEditor(page, 'Product diary', 'Daily product reflection.', 'product, personal');

  await openBank(page);
  await expectBankCards(page, 3);

  await page.getByTestId('tag-filter').filter({ hasText: '#product' }).click();
  await expectBankCards(page, 2);
  await expect(page.getByText('Product launch')).toBeVisible();
  await expect(page.getByText('Product diary')).toBeVisible();

  await page.getByTestId('tag-filter').filter({ hasText: '#personal' }).click();
  await expectBankCards(page, 1);
  await expect(page.getByText('Product diary')).toBeVisible();

  await page.getByTestId('reset-bank-filters').click();
  await page.getByTestId('bank-search').fill('story');
  await expectBankCards(page, 1);
  await expect(page.getByText('Personal story')).toBeVisible();
});

test('opening banked edit does not silently overwrite unrelated autosave buffer', async ({
  page
}) => {
  await startLocalMode(page);
  await bankPostFromEditor(
    page,
    'Пост из банка',
    'Текст, который уже готов и лежит в банке.',
    'banked'
  );

  await openEditor(page);
  await writePostFields(
    page,
    'Несохраненный буфер',
    'Этот локальный текст нельзя потерять при открытии другого поста.',
    'buffer'
  );

  await openFirstBankedPostForEdit(page);
  await expect(page.getByTestId('editor-conflict')).toBeVisible();
  await expect(page.getByTestId('editor-title')).toHaveValue('Несохраненный буфер');

  await page.getByRole('button', { name: 'Открыть выбранный' }).click();
  await expect(page.getByTestId('editor-conflict')).toBeHidden();
  await expect(page.getByTestId('editor-title')).toHaveValue('Пост из банка');
});

test('draft selection asks before replacing an unfinished manuscript', async ({ page }) => {
  await startLocalMode(page);
  await openEditor(page);

  await writePostFields(
    page,
    'Первый черновик',
    'Первый текст лежит в столе и ждет продолжения.',
    'draft'
  );
  await saveCurrentDraft(page);
  await page.getByRole('button', { name: 'Новый' }).click();

  await writePostFields(
    page,
    'Второй черновик',
    'Второй текст тоже пока не готов к банку.',
    'draft'
  );
  await saveCurrentDraft(page);

  await page.getByRole('button', { name: /Первый черновик/ }).click();
  await expect(page.getByTestId('editor-title')).toHaveValue('Первый черновик');

  await page
    .getByTestId('editor-content')
    .fill('Первый текст получил важное продолжение, которое нельзя потерять.');
  await expect(page.getByTestId('autosave-status')).toContainText('Сохранено в');

  await page.getByRole('button', { name: /Второй черновик/ }).click();
  await expect(page.getByTestId('editor-conflict')).toBeVisible();
  await expect(page.getByTestId('editor-title')).toHaveValue('Первый черновик');
  await expect(page.getByTestId('editor-content')).toHaveValue(
    'Первый текст получил важное продолжение, которое нельзя потерять.'
  );

  await page.getByRole('button', { name: 'Открыть выбранный' }).click();
  await expect(page.getByTestId('editor-conflict')).toBeHidden();
  await expect(page.getByTestId('editor-title')).toHaveValue('Второй черновик');
});
