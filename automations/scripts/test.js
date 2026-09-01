#!/usr/bin/env node

/**
 * Self-test for the automations/ package.
 *
 * Verifies the project is internally consistent WITHOUT any external
 * credentials, network access, or live side effects.
 *
 * What it checks:
 *   1. Every automation script exists and is syntactically valid via
 *      `node --check` (a child-process syntax parse). Scripts are NOT
 *      require()'d directly because they call main() and would hit
 *      GitHub/Discord on import.
 *   2. Required runtime dependencies (@octokit/rest, discord.js) resolve
 *      via require.resolve.
 *
 * Deterministic and safe: exits 0 on success, 1 on failure.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SCRIPTS_DIR = __dirname;
const SCRIPTS = [
  'sync-kanban.js',
  'generate-sprint-report.js',
  'send-discord-notification.js',
  'create-labels.js'
];

const DEPS = ['@octokit/rest', 'discord.js'];

const results = [];
function check(name, ok, detail) {
  const status = ok ? 'PASS  ' : 'FAIL  ';
  const line = ok ? `${status} ${name}` : `${status} ${name} - ${detail || ''}`;
  console.log(line);
  results.push({ name, ok, detail: ok ? '' : (detail || '') });
}

// --- 1. Script presence + syntax (node --check) --------------------------
for (const file of SCRIPTS) {
  const fullPath = path.join(SCRIPTS_DIR, file);
  if (!fs.existsSync(fullPath)) {
    check(`${file} exists`, false, 'file not found in scripts/');
    continue;
  }
  try {
    // parse-only check by the node binary; no imports, no network
    execFileSync(process.execPath, ['--check', fullPath], { stdio: 'ignore' });
    check(`${file} syntax (node --check)`, true);
  } catch (err) {
    check(`${file} syntax (node --check)`, false,
      (err.stderr ? err.stderr.toString() : 'parse error').split('\n')[0]);
  }
}

// --- 2. Runtime deps resolve ----------------------------------------------
for (const dep of DEPS) {
  try {
    require.resolve(dep);
    check(`${dep} resolves`, true);
  } catch (err) {
    check(`${dep} resolves`, false, 'cannot resolve from scripts/ (npm install?)');
  }
}

// --- report --------------------------------------------------------------
const failed = results.filter(r => !r.ok);
if (failed.length) {
  console.error(`\ntest FAILED: ${failed.length} check(s) failed: ${failed.map(f => f.name).join(', ')}`);
  process.exit(1);
} else {
  console.log(`\nAll ${results.length} checks passed. Project is internally consistent (no secrets/network used).`);
  process.exit(0);
}