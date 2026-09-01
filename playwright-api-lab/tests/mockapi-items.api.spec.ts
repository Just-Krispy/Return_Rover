import { test, expect } from '@playwright/test';
import apiData from '../shared/api-data.json';
import { retryFor429 } from './http-helpers';

// Test data lives in ../shared/api-data.json — the same single source of
// truth used to generate the Postman collection (npm run build:postman).
// Note: Postman replaces our {{timestamp}} placeholder with its native
// {{$timestamp}} dynamic variable, so payloads stay identical in both tools.
const { baseUrl, existingItemId, createItem, updateItem } = apiData.mockapi;

const uniqueName = (template: string) =>
  template.replace('{{timestamp}}', String(Date.now()));

test.describe('MockAPI items workflow', () => {
  test.describe.configure({ mode: 'serial' });

  test('GET returns the item collection', async ({ request }) => {
    const response = await retryFor429(() =>
      request.get(baseUrl, {
        headers: {
          Accept: 'application/json',
        },
      })
    );

    expect(response.status()).toBe(200);

    const items = await response.json();

    expect(Array.isArray(items)).toBeTruthy();
  });

  test('POST creates an item and GET retrieves it', async ({ request }) => {
    const itemName = uniqueName(createItem.name);
    let itemId: string | number | undefined;

    try {
      const createResponse = await retryFor429(() =>
        request.post(baseUrl, {
          data: {
            name: itemName,
            quantity: createItem.quantity,
          },
        })
      );

      expect(createResponse.status()).toBe(201);

      const createdItem = await createResponse.json();
      itemId = createdItem.id;

      expect(createdItem.name).toBe(itemName);
      expect(createdItem.quantity).toBe(createItem.quantity);

      await expect
        .poll(
          async () => {
            const getResponse = await retryFor429(() =>
              request.get(
                `${baseUrl}/${itemId}`,
                {
                  headers: {
                    Accept: 'application/json',
                    'Cache-Control': 'no-cache',
                  },
                }
              )
            );

            if (!getResponse.ok()) {
              return false;
            }

            const retrievedItem = await getResponse.json();

            return (
              retrievedItem.id === itemId &&
              retrievedItem.name === itemName &&
              retrievedItem.quantity === createItem.quantity
            );
          },
          {
            message: 'Waiting for MockAPI to return the created item',
            timeout: 10_000,
            intervals: [100, 250, 500, 1_000],
          }
        )
        .toBe(true);
    } finally {
      if (itemId !== undefined) {
        await retryFor429(() => request.delete(`${baseUrl}/${itemId}`));
      }
    }
  });

  test('POST creates, PUT updates, and GET verifies an item', async ({
    request,
  }) => {
    const originalName = uniqueName(createItem.name);
    let itemId: string | undefined;

    try {
      const createResponse = await retryFor429(() =>
        request.post(baseUrl, {
          data: {
            name: originalName,
            quantity: createItem.quantity,
          },
        })
      );

      expect(createResponse.status()).toBe(201);

      const createdItem = await createResponse.json();
      itemId = String(createdItem.id);

      const updateResponse = await retryFor429(() =>
        request.put(`${baseUrl}/${itemId}`, {
          headers: {
            Accept: 'application/json',
          },
          data: updateItem,
        })
      );

      expect(updateResponse.status()).toBe(200);

      await expect
        .poll(
          async () => {
            const getResponse = await retryFor429(() =>
              request.get(
                `${baseUrl}/${itemId}`,
                {
                  headers: {
                    Accept: 'application/json',
                    'Cache-Control': 'no-cache',
                  },
                }
              )
            );

            if (!getResponse.ok()) {
              return false;
            }

            const updatedItem = await getResponse.json();

            return (
              updatedItem.id === itemId &&
              updatedItem.name === updateItem.name &&
              updatedItem.quantity === updateItem.quantity
            );
          },
          {
            message: 'Waiting for MockAPI to return the persisted update',
            timeout: 10_000,
            intervals: [100, 250, 500, 1_000],
          }
        )
        .toBe(true);
    } finally {
      if (itemId !== undefined) {
        await retryFor429(() => request.delete(`${baseUrl}/${itemId}`));
      }
    }
  });

  test('PUT updates existing item from shared data', async ({ request }) => {
    const itemId = existingItemId;

    const updateResponse = await retryFor429(() =>
      request.put(`${baseUrl}/${itemId}`, {
        headers: {
          Accept: 'application/json',
        },
        data: updateItem,
      })
    );

    expect(updateResponse.status()).toBe(200);

    await expect
      .poll(
        async () => {
          const getResponse = await retryFor429(() =>
            request.get(
              `${baseUrl}/${itemId}`,
              {
                headers: {
                  Accept: 'application/json',
                  'Cache-Control': 'no-cache',
                },
              }
            )
          );

          if (!getResponse.ok()) {
            return false;
          }

          const updatedItem = await getResponse.json();

          return (
            updatedItem.id === itemId &&
            updatedItem.name === updateItem.name &&
            updatedItem.quantity === updateItem.quantity
          );
        },
        {
          message: 'Waiting for MockAPI to return the updated item',
          timeout: 10_000,
          intervals: [100, 250, 500, 1_000],
        }
      )
      .toBe(true);
  });
});