#!/usr/bin/env node
/**
 * prepare-postman-handoff.mjs
 *
 * One command to hand the whole API Lab to the Postman agent (or a human):
 *
 *   npm run handoff
 *
 * 1. Regenerates the Postman collection + environment from shared/api-data.json
 *    (the generator itself — no drift).
 * 2. Validates the generated files: stable IDs present, all 23 request URLs
 *    resolve against the environment variables, no stray unresolved {{vars}}.
 * 3. Writes postman/SETUP-BRIEF.md — a self-contained, paste-able brief the
 *    Postman agent can read to do the import, environment wiring, and run.
 * 4. Prints the same brief to the terminal so it can be copied directly.
 *
 * No Postman credentials required.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'postman');
const COLLECTION_FILE = join(OUT, 'Return-Rover-API-Lab.postman_collection.json');
const ENV_FILE = join(OUT, 'Return-Rover-API-Lab.postman_environment.json');
const BRIEF_FILE = join(OUT, 'SETUP-BRIEF.md');

/* ------------------------------------------------------------------ *
 * 1. Regenerate so the brief always describes the current files
 * ------------------------------------------------------------------ */
console.log('→ Regenerating Postman files from shared/api-data.json ...');
execFileSync(process.execPath, [join(__dirname, 'generate-postman-collection.mjs')], {
  stdio: 'inherit',
});

/* ------------------------------------------------------------------ *
 * 2. Validate
 * ------------------------------------------------------------------ */
if (!existsSync(COLLECTION_FILE) || !existsSync(ENV_FILE)) {
  console.error('✖ Missing generated files. Expected:');
  console.error('  ' + COLLECTION_FILE);
  console.error('  ' + ENV_FILE);
  process.exit(1);
}

const collection = JSON.parse(readFileSync(COLLECTION_FILE, 'utf8'));
const environment = JSON.parse(readFileSync(ENV_FILE, 'utf8'));

const problems = [];

if (!collection.info || !collection.info.name)
  problems.push('collection has no info.name');
if (!collection.info?._postman_id)
  problems.push('collection has no stable _postman_id');
if (!environment._postman_id)
  problems.push('environment has no stable _postman_id');
if (!Array.isArray(environment.values) || environment.values.length === 0)
  problems.push('environment has no values');

// Resolve every request URL against env vars + collection vars.
const vars = {};
for (const v of environment.values) vars[v.key] = v.value;
for (const v of collection.variable || []) vars[v.key] = v.value;
const RUNTIME_ONLY = new Set([
  '{{createdItemId}}',
  '{{createdItemName}}',
  '{{createdImageId}}',
  '{{createdImageName}}',
  '{{$timestamp}}',
  '{{postTitle}}',
]);
let totalRequests = 0;
for (const folder of collection.item) {
  for (const req of folder.item) {
    totalRequests++;
    const raw = req.request?.url?.raw;
    if (!raw) {
      problems.push(`request "${req.name}" has no url.raw`);
      continue;
    }
    const resolved = raw.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (m, k) => vars[k] ?? m);
    const leftover = (resolved.match(/\{\{([A-Za-z0-9_]+)\}\}/g) || []).filter(
      (x) => !RUNTIME_ONLY.has(x)
    );
    if (leftover.length) problems.push(`"${req.name}" has unresolved ${leftover.join(', ')}`);
    try {
      new URL(resolved);
    } catch {
      problems.push(`"${req.name}" URL does not resolve: ${resolved}`);
    }
  }
}

if (problems.length) {
  console.error('✖ Validation failed:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

console.log(`✔ Validated: ${collection.info.name} — ${totalRequests} requests, ${collection.item.length} folders, ${environment.values.length} env vars, stable IDs OK.`);

/* ------------------------------------------------------------------ *
 * 3. Build the brief
 * ------------------------------------------------------------------ */
const plain = (p) => `C:\\Users\\ryanc\\GitHub\\Return_Rover\\playwright-api-lab\\postman\\${p}`;

const folderLines = collection.item
  .map(
    (f) =>
      `### Folder: ${f.name} (${f.item.length} requests)\n` +
      f.item
        .map((r, i) => `   ${i + 1}. **${r.name}** — \`${r.request.method} ${r.request.url.raw}\``)
        .join('\n')
  )
  .join('\n\n');

const brief = `# Postman Agent Setup Brief — Return Rover API Lab

## What this is
A Postman collection + environment generated from a single shared data file
(\`shared/api-data.json\`) that also drives Playwright API tests. Same requests,
same payloads, same assertions — two tools in sync. The collection has **stable
IDs**, so re-importing replaces rather than duplicates.

## Files to import (both)
1. ${COLLECTION_FILE}
2. ${ENV_FILE}

Drag both onto the Postman web tab, or use Import → link with these (public repo only):
- https://raw.githubusercontent.com/Just-Krisky/Return_Rover/main/playwright-api-lab/postman/Return-Rover-API-Lab.postman_collection.json
- https://raw.githubusercontent.com/Just-Krisky/Return_Rover/main/playwright-api-lab/postman/Return-Rover-API-Lab.postman_environment.json

## After import
1. Select environment **Return Rover API Lab** from the dropdown (top-right).
2. Run requests in order within each folder (some folders chain via collection variables).

## Folders (run top to bottom)
${folderLines}

## Notes for the agent
- **MockAPI Image Upload**: the \`/images\` resource does not exist yet on the
  MockAPI project. It must be created in the MockAPI web dashboard
  (app.mockapi.io → New Resource → \`images\`) with fields
  \`name, mimeType, imageDataBase64, width, height, sizeBytes, tags\` — the
  Playwright test skips until then, and this Postman folder will 404 on it.
- **MockAPI Filters**: uses free-tier query params only (\`search\`, \`sortBy\`,
  \`order\`, \`limit\`+\`page\`). MockAPI's \`?filter=\` operator is a paid-plan
  feature and returns 404 on this workspace.
- **\`{{$timestamp}}\`** inside request bodies is Postman's dynamic variable
  (seconds); Playwright uses \`Date.now()\` (milliseconds). Same idea, different units.
- If a request in the web app asks for an "agent", that is Postman's browser
  sandbox — the Postman local/desktop agent resolves it.
- When data changes, regenerate with \`npm run build:postman\` then re-import
  (replace, thanks to stable IDs).
`;

writeFileSync(BRIEF_FILE, brief, 'utf8');
console.log('\n✔ Wrote ' + BRIEF_FILE);
console.log('\n──────────────────────── SETUP BRIEF ────────────────────────\n');
console.log(brief);
console.log('─────────────────────────────────────────────────────────────');
console.log('\nPaste the brief above into Postman Agent, or point it at:');
console.log('  ' + BRIEF_FILE);