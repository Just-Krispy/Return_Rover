import { test, expect } from '@playwright/test';
import apiData from '../shared/api-data.json';

// ============================================================
// VERIFIED LIVE against (2026-09-01):
//   https://6a95ddc0fa33b37f821afa85.mockapi.io/lab/v1/products
//
// Query form                        -> HTTP   actual behavior
// ------------------------------------------------------------------
// (no query)                        -> 200    5 seeded rows
// search=<term that matches>        -> 200    only matching rows
// search=<term with no match>       -> 404    body "Not found"
// sortBy=<field>&order=asc|desc     -> 200    rows sorted by field
// limit=N (bare)                    -> 200    IGNORED: returns ALL rows
// page=P&limit=L                    -> 200    1-indexed slice (limit only works with page)
// filter=field:value  (colon form)  -> 404    body "Not found"
//   The legacy `filter=field:value` operator is a PAID-plan feature
//   and is not available on this workspace -> hard 404.
// filter[field]=value (bracket form)-> 200    BUT is IGNORED:
//   even filter[category]=nonexistent returns ALL rows (no real filter).
//   Do NOT assert filtered contents on bracket form; it never filters.
// ===========================================================
//
// RUN MODEL: the three browser projects (chromium/firefox/webkit) all query the SAME
// live MockAPI resource. Locally Playwright parallelizes across them, and seeding a
// single shared resource from multiple workers at once is inherently racy. Run this
// spec with a single worker (`npx playwright test ... --workers=1`), which is exactly
// what the project's CI config uses (`workers: process.env.CI ? 1 : undefined`).
const { productsBaseUrl, productsSeed } = apiData.mockapi;

const url = (query: string) => `${productsBaseUrl}?${query}`;

async function getJson(request: any, query: string) {
  const res = await request.get(url(query));
  if (res.status() === 404) return { status: 404, rows: <any[]>[] };
  return { status: res.status(), rows: <any[]>await res.json() };
}

async function clearExisting(request: any) {
  // Empty the resource so our seeded rows are the only ones (deterministic).
  const res = await request.get(`${productsBaseUrl}?page=1&limit=100`);
  if (!res.ok()) return;
  const rows = await res.json();
  for (const row of rows) {
    if (row.id) await request.delete(`${productsBaseUrl}/${row.id}`);
  }
}

async function seed(request: any) {
  await clearExisting(request);
  const ids: string[] = [];
  for (const seedRow of productsSeed) {
    const r = await request.post(productsBaseUrl, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      data: seedRow,
    });
    if (r.ok()) {
      const created = await r.json();
      if (created.id) ids.push(String(created.id));
    }
  }
  return ids;
}

test.describe('MockAPI products: live-supported query mechanisms', () => {
  test.describe.configure({ mode: 'serial' });

  // MockAPI free tier does NOT support real filtering: the legacy `filter=field:value`
  // operator 404s (paid plan) and the bracketed `filter[field]=value` form is accepted
  // (200) but returns every row unchanged. So this suite exercises the mechanisms that
  // genuinely work against the live resource: search, sortBy, order, page+limit, and
  // reading each seeded row back. The two "filter" tests at the end assert the REAL
  // (non-filtering) behavior — we never assert on fantasy.

  test('seed the catalog to the deterministic 5 rows', async ({ request }) => {
    // The shared resource may drift (rows added/removed by other tools), so square it
    // back to the canonical 5 before asserting deterministic counts below.
    const ids = await seed(request);
    expect(ids.length).toBe(productsSeed.length);
  });

  test('search returns only rows matching the term', async ({ request }) => {
    const { status, rows } = await getJson(request, 'search=robot');
    expect(status).toBe(200);
    expect(rows.length).toBe(1);
    expect(rows[0].name).toContain('Solar Bot Kit');
  });

  test('search matches across multiple rows', async ({ request }) => {
    const { status, rows } = await getJson(request, 'search=book');
    expect(status).toBe(200);
    expect(rows.length).toBe(3);
    for (const r of rows) {
      expect(JSON.stringify(r).toLowerCase()).toContain('book');
    }
  });

  test('search with no match returns 404 "Not found" (MockAPI quirk)', async ({ request }) => {
    // Unlike most APIs, a search that matches nothing does NOT return an empty array —
    // MockAPI returns HTTP 404. Documented here rather than patched over.
    const res = await request.get(url('search=zzzzzz'));
    expect(res.status()).toBe(404);
    // MockAPI's 404 body is the JSON-encoded string "Not found" (literal quotes).
    expect(await res.text()).toContain('Not found');
  });

  test('sort by rating descending', async ({ request }) => {
    const { status, rows } = await getJson(request, 'sortBy=rating&order=desc');
    expect(status).toBe(200);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].rating >= rows[i].rating).toBe(true);
    }
  });

  test('sort by price ascending', async ({ request }) => {
    const { status, rows } = await getJson(request, 'sortBy=price&order=asc');
    expect(status).toBe(200);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].price <= rows[i].price).toBe(true);
    }
  });

  test('pagination: limit is honored only together with page', async ({ request }) => {
    // MockAPI quirk (VERIFIED LIVE): a bare `limit=N` is IGNORED — GET ?limit=2
    // returns ALL rows. `limit` only takes effect when combined with `page`.
    const bare = await getJson(request, 'limit=2');
    expect(bare.status).toBe(200);
    expect(bare.rows.length).toBe(productsSeed.length); // ignored -> every row

    const sliced = await getJson(request, 'page=1&limit=2');
    expect(sliced.status).toBe(200);
    expect(sliced.rows.length).toBe(2); // page+limit works
  });

  test('pagination slices disjoint pages (1-indexed)', async ({ request }) => {
    const p1 = await getJson(request, 'page=1&limit=2');
    const p2 = await getJson(request, 'page=2&limit=2');
    const p3 = await getJson(request, 'page=3&limit=2');
    expect(p1.status).toBe(200);
    expect(p2.status).toBe(200);
    expect(p3.status).toBe(200);
    expect(p1.rows.length).toBe(2);
    expect(p2.rows.length).toBe(2);
    expect(p3.rows.length).toBe(1); // page 3 of a 5-row catalog with limit 2

    const ids = (rows: any[]) => new Set(rows.map((r: any) => r.id));
    const seen = new Set<string>();
    for (const rows of [p1.rows, p2.rows, p3.rows]) {
      for (const id of ids(rows)) {
        expect(seen.has(id)).toBe(false); // no row appears on two pages
        seen.add(id);
      }
    }
    expect(seen.size).toBe(productsSeed.length); // pages cover the whole catalog
  });

  test('reads back every seeded row with expected fields', async ({ request }) => {
    const { status, rows } = await getJson(request, 'page=1&limit=100');
    expect(status).toBe(200);
    expect(rows.length).toBe(productsSeed.length);
    const byName = new Map(productsSeed.map((s: any) => [s.name, s]));
    for (const r of rows) {
      const seedCol = byName.get(r.name);
      expect(seedCol).toBeDefined();
      expect(typeof r.id).toBe('string');               // MockAPI assigns string ids
      expect(r.price).toBe(seedCol.price);              // value round-trips
      expect(r.category).toBe(seedCol.category);        // value round-trips
      expect(typeof r.in_stock).toBe('boolean');        // schema boolean field
    }
  });

  test('filter=field:value colon operator is NOT supported -> 404', async ({ request }) => {
    // Legacy operator filter is a paid-plan feature: 404 on free tier. KEEPING this
    // assertion documents reality rather than pretending filtering works.
    const res = await request.get(url('filter=category:book'));
    expect(res.status()).toBe(404);
    // MockAPI's 404 body is the JSON-encoded string "Not found" (literal quotes).
    expect(await res.text()).toContain('Not found');
  });

  test('filter[field]=value bracket form is accepted but does NOT filter', async ({ request }) => {
    // MockAPI accepts the bracketed form (200) but IGNORES it — a nonsense filter
    // value returns every row. This is the real behavior; do not expect filtering.
    const { status, rows } = await getJson(request, 'filter[category]=nonexistent');
    expect(status).toBe(200);
    expect(rows.length).toBe(productsSeed.length); // all rows, none removed
  });
});