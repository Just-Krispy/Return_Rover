#!/usr/bin/env node
/**
 * import-to-postman.mjs
 *
 * Fully-automated way to push the generated collection + environment into a
 * Postman workspace via the Postman API — so the Postman agent (or a script)
 * can do the setup end-to-end, no drag-and-drop.
 *
 * Usage:
 *   npm run postman:import
 *
 * Requires an environment variable:
 *   POSTMAN_API_KEY    your Postman API key (Postman web app → Settings →
 *                      API keys → Create API Key)
 * Optional:
 *   POSTMAN_WORKSPACE  workspace name to target (default: "My-Workspace")
 *
 * Behavior:
 *   - Creates the collection/environment if they don't exist, otherwise
 *     updates them in place (matches the stable-ID replace behavior).
 *   - Prints UI links and a summary at the end.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'postman');
const COLLECTION_FILE = join(OUT, 'Return-Rover-API-Lab.postman_collection.json');
const ENV_FILE = join(OUT, 'Return-Rover-API-Lab.postman_environment.json');

const API = 'https://api.getpostman.com';
const API_KEY = process.env.POSTMAN_API_KEY;
const TARGET_WORKSPACE = process.env.POSTMAN_WORKSPACE || 'My-Workspace';

if (!API_KEY) {
  console.error('✖ POSTMAN_API_KEY is not set.');
  console.error('  Get one: Postman web app → Settings → API keys → Create API Key');
  console.error('  Then run: set POSTMAN_API_KEY=yourkey && npm run postman:import');
  console.error('  (Or skip this and use the drag-and-drop path — no key needed.)');
  process.exit(1);
}

for (const f of [COLLECTION_FILE, ENV_FILE]) {
  if (!existsSync(f)) {
    console.error('✖ Missing ' + f + ' — run `npm run build:postman` first.');
    process.exit(1);
  }
}

const collection = JSON.parse(readFileSync(COLLECTION_FILE, 'utf8'));
const environment = JSON.parse(readFileSync(ENV_FILE, 'utf8'));

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'X-Api-Key': API_KEY,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${opts.method || 'GET'} ${path} → ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
  return body;
}

/* 1. Find the target workspace */
console.log('→ Listing workspaces ...');
const wsList = await api('/workspaces');
const ws = wsList.workspaces.find((w) => w.name === TARGET_WORKSPACE) || wsList.workspaces[0];
if (!ws) {
  console.error('✖ No workspaces found for this API key.');
  process.exit(1);
}
console.log(`✔ Workspace: "${ws.name}" (id ${ws.id})`);

const wsParam = `?workspace=${ws.id}`;

/* 2. Collection: create or update */
console.log('→ Upserting collection ...');
let colList = await api('/collections' + wsParam);
const existingCol = colList.collections.find((c) => c.name === collection.info.name);
let colResult;
if (existingCol) {
  colResult = await api(`/collections/${existingCol.uid}`, {
    method: 'PUT',
    body: JSON.stringify(collection),
  });
  console.log(`✔ Updated collection "${collection.info.name}" (uid ${existingCol.uid})`);
} else {
  colResult = await api('/collections' + wsParam, {
    method: 'POST',
    body: JSON.stringify(collection),
  });
  console.log(`✔ Created collection "${collection.info.name}" (uid ${colResult.collection.uid})`);
}

/* 3. Environment: create or update */
console.log('→ Upserting environment ...');
let envList = await api('/environments' + wsParam);
const existingEnv = envList.environments.find((e) => e.name === environment.name);
let envResult;
if (existingEnv) {
  envResult = await api(`/environments/${existingEnv.uid}`, {
    method: 'PUT',
    body: JSON.stringify({ environment }),
  });
  console.log(`✔ Updated environment "${environment.name}" (uid ${existingEnv.uid})`);
} else {
  envResult = await api('/environments' + wsParam, {
    method: 'POST',
    body: JSON.stringify({ environment }),
  });
  console.log(`✔ Created environment "${environment.name}" (uid ${envResult.environment.uid})`);
}

/* 4. Summary */
console.log('\n────────── Done ──────────');
console.log(`Workspace:  ${ws.name}`);
console.log(`Collection and environment are ready in "${ws.name}".`);
console.log(`Open:       https://web.postman.co/workspace/${ws.id}`);
console.log('\nThen select the "Return Rover API Lab" environment and run folders top-to-bottom.');