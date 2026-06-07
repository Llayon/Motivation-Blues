import { afterEach, describe, expect, test, vi } from 'vitest';
import { collectCurrentPageAssetUrls } from './registerServiceWorker';

describe('service worker registration helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('collects same-origin scripts, links, and Vite assets only', () => {
    const document = {
      querySelectorAll: vi.fn((selector: string) => {
        if (selector === 'script[src]') {
          return [{ src: 'https://example.test/assets/index.js' }];
        }

        if (selector === 'link[href]') {
          return [
            {
              href: 'https://example.test/assets/index.css',
              relList: { contains: (rel: string) => rel === 'stylesheet' }
            },
            {
              href: 'https://telegram.org/js/telegram-web-app.js',
              relList: { contains: (rel: string) => rel === 'preload' }
            }
          ];
        }

        return [];
      })
    };
    const performance = {
      getEntriesByType: vi.fn(() => [
        { name: 'https://example.test/assets/Dashboard.js' },
        { name: 'https://cdn.example.test/assets/foreign.js' }
      ])
    };

    vi.stubGlobal('window', {
      location: { href: 'https://example.test/', origin: 'https://example.test' }
    });
    vi.stubGlobal('document', document);
    vi.stubGlobal('performance', performance);

    expect(collectCurrentPageAssetUrls()).toEqual([
      'https://example.test/assets/index.js',
      'https://example.test/assets/index.css',
      'https://example.test/assets/Dashboard.js'
    ]);
  });
});
