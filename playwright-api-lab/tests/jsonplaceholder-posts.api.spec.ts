import { test, expect } from '@playwright/test';
import apiData from '../shared/api-data.json';
import { retryFor429 } from './http-helpers';

// Test data lives in ../shared/api-data.json — the same single source of
// truth used to generate the Postman collection (npm run build:postman).
// Edit the data there and both tools stay in sync.
const { baseUrl, postId, unknownPostId, newPost, updatedPost } =
  apiData.jsonplaceholder;

test.describe('JSONPlaceholder posts API', () => {
  test('GET retrieves a post', async ({ request }) => {
    const response = await retryFor429(() => request.get(`${baseUrl}/posts/${postId}`));

    expect(response.status()).toBe(200);

    const post = await response.json();

    expect(post.id).toBe(postId);
    expect(post.userId).toBe(1);
    expect(post.title).toBeTruthy();
  });

  test('GET returns 404 for an unknown post', async ({ request }) => {
    const response = await retryFor429(() =>
      request.get(`${baseUrl}/posts/${unknownPostId}`)
    );

    expect(response.status()).toBe(404);
  });

  test('POST creates a post', async ({ request }) => {
    const response = await retryFor429(() =>
      request.post(`${baseUrl}/posts`, {
        data: newPost,
      })
    );

    expect(response.status()).toBe(201);

    const post = await response.json();

    expect(post.title).toBe(newPost.title);
    expect(post.body).toBe(newPost.body);
    expect(post.id).toBeTruthy();
  });

  test('PUT updates a post', async ({ request }) => {
    const response = await retryFor429(() =>
      request.put(`${baseUrl}/posts/${postId}`, {
        data: updatedPost,
      })
    );

    expect(response.status()).toBe(200);

    const post = await response.json();

    expect(post.id).toBe(postId);
    expect(post.title).toBe(updatedPost.title);
  });

  test('DELETE removes a post', async ({ request }) => {
    const response = await retryFor429(() =>
      request.delete(`${baseUrl}/posts/${postId}`)
    );

    expect(response.status()).toBe(200);
  });
});