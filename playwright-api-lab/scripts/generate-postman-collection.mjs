/**
 * Build the Postman collection from the shared API test data.
 *
 *   npm run build:postman
 *
 * Reads ../shared/api-data.json (the same single source of truth the
 * Playwright tests use) and writes:
 *   ../postman/Return-Rover-API-Lab.postman_collection.json
 *   ../postman/Return-Rover-API-Lab.postman_environment.json
 *
 * The {{timestamp}} placeholder in the data is converted to Postman's
 * native dynamic variable {{$timestamp}} inside request bodies.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const DATA = JSON.parse(
  readFileSync(join(root, 'shared', 'api-data.json'), 'utf8')
);

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const POSTMAN_TIMESTAMP = '{{$timestamp}}';

/** Stable IDs so re-importing a regenerated file REPLACES (not duplicates)
 *  the existing Postman collection/environment in web workspaces. */
const COLLECTION_ID = 'f1d3a2c4-8b6e-4f0a-9d1c-5e7b2a4c9f11';
const ENVIRONMENT_ID = 'e2a4b6c8-d0f1-4a3b-8c5d-9e7f2a4b6c88';

const ENV_JSONPLACEHOLDER = '{{jsonplaceholderBaseUrl}}';
const ENV_MOCKAPI = '{{mockapiBaseUrl}}';

/** Replace the shared {{timestamp}} token with Postman's dynamic var. */
function toPostmanTimestamp(value) {
  return value.replaceAll('{{timestamp}}', POSTMAN_TIMESTAMP);
}

/** Build Postman's object-style URL from a raw string. URLs that start
 *  with a {{variable}} keep that variable as the host segment so the
 *  environment file actually drives the requests (and can be overridden). */
function postmanUrl(raw) {
  const varMatch = raw.match(/^\{\{([A-Za-z0-9_]+)\}\}(.*)$/s);
  if (varMatch) {
    const [, variable, rest] = varMatch;
    const [pathPart, queryPart] = rest.split('?');
    return {
      raw,
      host: [`{{${variable}}}`],
      ...(pathPart ? { path: pathPart.split('/').filter(Boolean) } : {}),
      ...(queryPart
        ? {
            query: [...new URLSearchParams(queryPart).entries()].map(
              ([key, value]) => ({ key, value, disabled: false })
            ),
          }
        : {}),
    };
  }
  const u = new URL(raw);
  return {
    raw,
    protocol: u.protocol.replace(':', ''),
    host: u.hostname.split('.'),
    path: u.pathname.split('/').filter(Boolean),
    ...(u.port ? { port: Number(u.port) } : {}),
    query: [...u.searchParams.entries()].map(([key, value]) => ({
      key,
      value,
      disabled: false,
    })),
  };
}

function jsonBody(obj, replaceTimestamps = false) {
  let raw = JSON.stringify(obj, null, 2);
  if (replaceTimestamps) raw = toPostmanTimestamp(raw);
  return {
    mode: 'raw',
    raw,
    options: { raw: { language: 'json' } },
  };
}

function event(listen, script) {
  return {
    listen,
    script: {
      type: 'text/javascript',
      exec: String(script).trim().split('\n'),
    },
  };
}

function request({ name, method, rawUrl, headers = [], body, events = [] }) {
  return {
    name,
    request: {
      method,
      header: headers.map(([key, value]) => ({ key, value })),
      url: postmanUrl(rawUrl),
      ...(body ? { body } : {}),
      description: `Mirrors the "${name}" workflow in the Playwright tests (tests/*.api.spec.ts).`,
    },
    response: [],
    ...(events.length ? { event: events } : {}),
  };
}

const jsonAccept = [['Accept', 'application/json']];

/* ------------------------------------------------------------------ *
 * JSONPlaceholder folder (mirrors jsonplaceholder-posts.api.spec.ts)
 * ------------------------------------------------------------------ */

const jp = (path) => `${ENV_JSONPLACEHOLDER}${path}`;

const jsonplaceholderFolder = {
  name: 'JSONPlaceholder Posts',
  item: [
    request({
      name: 'List posts',
      method: 'GET',
      rawUrl: jp('/posts'),
      headers: jsonAccept,
      events: [
        event('test', `
pm.test("GET returns 200", () => pm.response.to.have.status(200));
const posts = pm.response.json();
pm.test("Response is an array", () => pm.expect(Array.isArray(posts)).to.be.true);
pm.test("Array is not empty", () => pm.expect(posts.length).to.be.greaterThan(0));
`),
      ],
    }),
    request({
      name: 'Get post 1',
      method: 'GET',
      rawUrl: jp('/posts/{{postId}}'),
      headers: jsonAccept,
      events: [
        event('test', `
pm.test("GET returns 200", () => pm.response.to.have.status(200));
const post = pm.response.json();
pm.test("Post id matches the request", () => pm.expect(post.id).to.eql(Number(pm.collectionVariables.get("postId"))));
pm.test("User id is 1", () => pm.expect(post.userId).to.eql(1));
pm.test("Title is present", () => pm.expect(post.title).to.be.a("string").and.to.have.lengthOf.greaterThan(0));
pm.collectionVariables.set("postTitle", post.title);
`),
      ],
    }),
    request({
      name: 'Get unknown post (expect 404)',
      method: 'GET',
      rawUrl: jp('/posts/{{unknownPostId}}'),
      headers: jsonAccept,
      events: [
        event('test', `
pm.test("GET returns 404 for an unknown post", () => pm.response.to.have.status(404));
`),
      ],
    }),
    request({
      name: 'Create post',
      method: 'POST',
      rawUrl: jp('/posts'),
      headers: [['Content-Type', 'application/json'], ...jsonAccept],
      body: jsonBody(DATA.jsonplaceholder.newPost),
      events: [
        event('test', `
pm.test("POST returns 201", () => pm.response.to.have.status(201));
const post = pm.response.json();
pm.test("Title matches what we sent", () => pm.expect(post.title).to.eql(${JSON.stringify(DATA.jsonplaceholder.newPost.title)}));
pm.test("Response includes a new id", () => pm.expect(post.id).to.exist);
`),
      ],
    }),
    request({
      name: 'Update post 1',
      method: 'PUT',
      rawUrl: jp('/posts/{{postId}}'),
      headers: [['Content-Type', 'application/json'], ...jsonAccept],
      body: jsonBody(DATA.jsonplaceholder.updatedPost),
      events: [
        event('test', `
pm.test("PUT returns 200", () => pm.response.to.have.status(200));
const post = pm.response.json();
pm.test("Title was updated", () => pm.expect(post.title).to.eql(${JSON.stringify(DATA.jsonplaceholder.updatedPost.title)}));
pm.test("Same post id", () => pm.expect(post.id).to.eql(Number(pm.collectionVariables.get("postId"))));
`),
      ],
    }),
    request({
      name: 'Delete post 1',
      method: 'DELETE',
      rawUrl: jp('/posts/{{postId}}'),
      headers: jsonAccept,
      events: [
        event('test', `
pm.test("DELETE returns 200", () => pm.response.to.have.status(200));
`),
      ],
    }),
  ],
};

/* ------------------------------------------------------------------ *
 * MockAPI folder (mirrors mockapi-items.api.spec.ts)
 * ------------------------------------------------------------------ */

const mockapiFolder = {
  name: 'MockAPI Items workflow',
  item: [
    request({
      name: 'List items',
      method: 'GET',
      rawUrl: `${ENV_MOCKAPI}`,
      headers: jsonAccept,
      events: [
        event('test', `
pm.test("GET returns 200", () => pm.response.to.have.status(200));
const items = pm.response.json();
pm.test("Response is an array", () => pm.expect(Array.isArray(items)).to.be.true);
`),
      ],
    }),
    request({
      name: 'Create item',
      method: 'POST',
      rawUrl: `${ENV_MOCKAPI}`,
      headers: [['Content-Type', 'application/json'], ...jsonAccept],
      body: jsonBody(DATA.mockapi.createItem, true),
      events: [
        event('test', `
pm.test("POST returns 201", () => pm.response.to.have.status(201));
const item = pm.response.json();
pm.test("Item has an id", () => pm.expect(item.id).to.exist);
pm.test("Quantity matches", () => pm.expect(item.quantity).to.eql(${DATA.mockapi.createItem.quantity}));
pm.collectionVariables.set("createdItemId", item.id);
pm.collectionVariables.set("createdItemName", item.name);
`),
      ],
    }),
    request({
      name: 'Get created item',
      method: 'GET',
      rawUrl: `${ENV_MOCKAPI}/{{createdItemId}}?cacheBust=${POSTMAN_TIMESTAMP}`,
      headers: jsonAccept,
      events: [
        event('test', `
pm.test("GET returns 200", () => pm.response.to.have.status(200));
const item = pm.response.json();
pm.test("Returned the item we created", () => {
  pm.expect(String(item.id)).to.eql(pm.collectionVariables.get("createdItemId"));
  pm.expect(item.name).to.eql(pm.collectionVariables.get("createdItemName"));
});
`),
      ],
    }),
    request({
      name: 'Update existing item (id 47)',
      method: 'PUT',
      rawUrl: `${ENV_MOCKAPI}/{{existingItemId}}`,
      headers: [['Content-Type', 'application/json'], ...jsonAccept],
      body: jsonBody(DATA.mockapi.updateItem),
      events: [
        event('test', `
pm.test("PUT returns 200", () => pm.response.to.have.status(200));
const item = pm.response.json();
pm.test("Name was updated", () => pm.expect(item.name).to.eql(${JSON.stringify(DATA.mockapi.updateItem.name)}));
pm.test("Quantity was updated", () => pm.expect(item.quantity).to.eql(${DATA.mockapi.updateItem.quantity}));
`),
      ],
    }),
    request({
      name: 'Delete created item (cleanup)',
      method: 'DELETE',
      rawUrl: `${ENV_MOCKAPI}/{{createdItemId}}`,
      headers: jsonAccept,
      events: [
        event('prerequest', `
// Mirrors the Playwright "finally" block that cleans up after the test.
const id = pm.collectionVariables.get("createdItemId");
if (!id) throw new Error("No created item to delete. Run 'Create item' first.");
`),
        event('test', `
pm.test("DELETE returns 200", () => pm.response.to.have.status(200));
pm.collectionVariables.unset("createdItemId");
pm.collectionVariables.unset("createdItemName");
`),
      ],
    }),
  ],
};

/* ------------------------------------------------------------------ *
 * Collection + environment
 * ------------------------------------------------------------------ */

const collection = {
  info: {
    _postman_id: COLLECTION_ID,
    name: 'Return Rover API Lab',
    description:
      'Generated from shared/api-data.json by scripts/generate-postman-collection.mjs.\n' +
      'Reproduces the same requests, payloads, and assertions as the Playwright tests in ./tests — ' +
      'edit the shared data file once and regenerate with `npm run build:postman`.\n' +
      'Base URLs come from the selected environment; clone it to a "staging" env to override them.',
    schema:
      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [jsonplaceholderFolder, mockapiFolder],
  variable: [
    { key: 'postId', value: String(DATA.jsonplaceholder.postId) },
    { key: 'unknownPostId', value: String(DATA.jsonplaceholder.unknownPostId) },
    { key: 'existingItemId', value: String(DATA.mockapi.existingItemId) },
  ],
};

const environment = {
  _postman_id: ENVIRONMENT_ID,
  name: 'Return Rover API Lab',
  values: [
    {
      key: 'jsonplaceholderBaseUrl',
      value: DATA.jsonplaceholder.baseUrl,
      type: 'default',
      enabled: true,
    },
    {
      key: 'mockapiBaseUrl',
      value: DATA.mockapi.baseUrl,
      type: 'default',
      enabled: true,
    },
  ],
  _postman_variable_scope: 'environment',
};

/* ------------------------------------------------------------------ *
 * Write files
 * ------------------------------------------------------------------ */

const outDir = join(root, 'postman');
mkdirSync(outDir, { recursive: true });

const collectionPath = join(outDir, 'Return-Rover-API-Lab.postman_collection.json');
const environmentPath = join(outDir, 'Return-Rover-API-Lab.postman_environment.json');

writeFileSync(collectionPath, JSON.stringify(collection, null, 2) + '\n');
writeFileSync(environmentPath, JSON.stringify(environment, null, 2) + '\n');

console.log('Wrote:');
console.log('  ' + collectionPath);
console.log('  ' + environmentPath);
console.log('Import both into Postman (web workspace or VS Code extension), select the');
console.log('"Return Rover API Lab" environment, and run requests in folder order.');
console.log('Stable IDs: re-importing a regenerated file replaces the existing');
console.log('collection/environment instead of creating a duplicate.');