#!/usr/bin/env node
/**
 * check-mockapi-resources.mjs
 *
 * Reads the health/readiness of the two MockAPI resources used by this
 * project (products + images) so a human or a CI job can see, at a glance,
 * whether the backend is ready for the API-lab tests.
 *
 * Behavior:
 *   - GETs each resource independently (one failure never blocks the other).
 *   - 'products':  ready when HTTP 200 AND the seeded rows are present.
 *   - 'images':    ready when HTTP 200 (it is created in the MockAPI dashboard).
 *   - Exit code 0 when BOTH are ready, 1 otherwise.
 */
import { setTimeout as sleep } from 'node:timers/promises';

const BASE_URL = 'https://6a95ddc0fa33b37f821afa85.mockapi.io/lab/v1';
const TIMEOUT_MS = 8000; // short timeout (~8s)

// Fields the 'images' resource must expose once created in the dashboard.
const IMAGE_FIELDS = [
  'name',
  'mimeType',
  'imageDataBase64',
  'width',
  'height',
  'sizeBytes',
  'tags',
].join(', ');

function friendlyError(err) {
  return `${err.name ?? 'Error'}: ${err.message}`;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function checkProducts() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/products`, TIMEOUT_MS);
    const status = res.status;

    if (status !== 200) {
      return {
        ok: false,
        name: 'products',
        status,
        detail: `HTTP ${status}. The products resource did not return 200 (expected seeded resource).`,
      };
    }

    let count;
    try {
      const data = await res.json();
      count = Array.isArray(data) ? data.length : null;
    } catch {
      count = null;
    }

    const ready = count !== null && count > 0;
    return {
      ok: ready,
      name: 'products',
      status,
      detail:
        count === null
          ? 'HTTP 200 but the body was not a JSON array (could not count seed rows).'
          : ready
            ? `OK - seeded rows present (${count} records).`
            : 'HTTP 200 but 0 records found; the seed data may be missing.',
    };
  } catch (err) {
    return {
      ok: false,
      name: 'products',
      status: null,
      detail: `Request failed or timed out after ${TIMEOUT_MS}ms: ${friendlyError(err)}`,
    };
  }
}

async function checkImages() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/images`, TIMEOUT_MS);
    const status = res.status;

    if (status === 200) {
      return {
        ok: true,
        name: 'images',
        status,
        detail: `OK - images resource exists and is ready (HTTP 200).`,
      };
    }

    if (status === 404) {
      return {
        ok: false,
        name: 'images',
        status,
        detail:
          `HTTP 404 - the images resource has NOT been created yet. ` +
          `Create it in the MockAPI dashboard (https://mockapi.io) before running the image-upload tests. ` +
          `It should accept JSON records with fields: ${IMAGE_FIELDS}.`,
      };
    }

    return {
      ok: false,
      name: 'images',
      status,
      detail: `HTTP ${status}. Expected 200 (ready) or 404 (not created).`,
    };
  } catch (err) {
    return {
      ok: false,
      name: 'images',
      status: null,
      detail: `Request failed or timed out after ${TIMEOUT_MS}ms: ${friendlyError(err)}`,
    };
  }
}

const [products, images] = await Promise.all([checkProducts(), checkImages()]);

const line = '='.repeat(60);
console.log(line);
console.log(' MockAPI resource readiness report');
console.log(line);

const report = [products, images];
for (const r of report) {
  const statusText = r.status === null ? 'ERROR' : `HTTP ${r.status}`;
  console.log(`\n[${r.name.toUpperCase()}] ${statusText}`);
  console.log(`  ${r.detail}`);
}

const readyAll = report.every((r) => r.ok);
console.log('\n' + line);
console.log(` Result: ${readyAll ? 'BOTH READY' : 'NOT READY'}`);
console.log(line);

process.exitCode = readyAll ? 0 : 1;