import { test, expect } from '@playwright/test';
import apiData from '../shared/api-data.json';
import { retryFor429 } from './http-helpers';

// Image "upload" resource on MockAPI.
// NOTE: MockAPI stores JSON, not binary files. An image upload is modelled as
// a JSON record whose imageDataBase64 field holds a data: URL (base64) string,
// plus metadata. Tests: create -> read back -> verify -> cleanup.
const { imagesBaseUrl, createImage } = apiData.mockapi;

const uniqueName = (template: string) =>
  template.replace('{{timestamp}}', String(Date.now()));

test.describe('MockAPI image upload workflow', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    // MockAPI resources are created in the web UI, not via API. If the
    // /images resource hasn't been created yet, skip this file with a hint
    // instead of failing.
    const probe = await retryFor429(() => request.get(`${imagesBaseUrl}?limit=1`));
    test.skip(
      !probe.ok(),
      'MockAPI resource /images does not exist yet. Create it in the MockAPI web UI (New Resource → images), then re-run this workflow.'
    );
  });

  test('POST uploads an image record (base64 data URL)', async ({ request }) => {
    // The shared data stores a placeholder token; make it unique per run.
    const payload = {
      ...createImage,
      name: uniqueName(createImage.name),
    };

    const response = await retryFor429(() =>
      request.post(imagesBaseUrl, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        data: payload,
      })
    );

    expect(response.status()).toBe(201);

    const created = await response.json();
    const id = created.id;

    try {
      // Required metadata fields must be present.
      expect(created.name).toBe(payload.name);
      expect(typeof created.imageDataBase64).toBe('string');
      expect(created.imageDataBase64.startsWith('data:image/')).toBe(true);
      expect(payload.width).toBe(4);
      expect(payload.height).toBe(4);
      expect(payload.sizeBytes).toBeGreaterThan(0);
      expect(payload.mimeType).toBe('image/png');

      // Read it back and confirm it round-trips.
      await expect
        .poll(
          async () => {
            const get = await retryFor429(() =>
              request.get(`${imagesBaseUrl}/${id}`, {
                headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
              })
            );
            if (!get.ok()) return false;
            const item = await get.json();
            return (
              item.id === id &&
              item.name === payload.name &&
              item.imageDataBase64 === payload.imageDataBase64
            );
          },
          { timeout: 10_000, intervals: [100, 250, 500, 1000] }
        )
        .toBe(true);
    } finally {
      await retryFor429(() => request.delete(`${imagesBaseUrl}/${id}`));
    }
  });
});