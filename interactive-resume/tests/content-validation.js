/**
 * Interactive Resume — Content Validation Harness
 *
 * Pure-Node content tests that run without a browser.
 * Validates resume-data.ts fields, archer-chat.ts knowledge
 * coverage, and structural consistency.
 *
 * Run:  node tests/content-validation.js
 */

const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const vm = require("vm");

// ── Transpile and load resume-data.ts ──
function loadModule(tsPath) {
  const source = fs.readFileSync(tsPath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(compiled, {
    exports: mod.exports,
    module: mod,
    require,
  });
  return mod.exports;
}

const repoRoot = path.join(__dirname, "..");
const resumeData = loadModule(path.join(repoRoot, "lib", "resume-data.ts"));
const archerChat = loadModule(path.join(repoRoot, "lib", "archer-chat.ts"));

let pass = 0;
let fail = 0;
const failures = [];

function assert(condition, msg) {
  if (condition) {
    pass++;
    console.log(`  PASS: ${msg}`);
  } else {
    fail++;
    failures.push(msg);
    console.error(`  FAIL: ${msg}`);
  }
}

// ──────────────────────────────
// 1. Contact Completeness
// ──────────────────────────────
console.log("\n== Contact Completeness ==");
assert(resumeData.contact.name, "Contact has name");
assert(resumeData.contact.email, "Contact has email");
assert(resumeData.contact.email.includes("@"), "Email looks valid");
assert(resumeData.contact.phone, "Contact has phone");
assert(resumeData.contact.linkedin, "Contact has LinkedIn");
assert(resumeData.contact.github, "Contact has GitHub");
assert(resumeData.contact.tagline, "Contact has tagline");
assert(resumeData.contact.summary, "Contact has summary");
assert(resumeData.contact.location, "Contact has location");

// ──────────────────────────────
// 2. Hero Stats
// ──────────────────────────────
console.log("\n== Hero Stats ==");
assert(
  Array.isArray(resumeData.heroStats) && resumeData.heroStats.length === 3,
  "Exactly 3 hero stats"
);
for (const stat of resumeData.heroStats || []) {
  assert(stat.value && stat.label, `Stat "${stat.value}" has value and label`);
}

// ──────────────────────────────
// 3. Now Shipping
// ──────────────────────────────
console.log("\n== Now Shipping ==");
assert(
  Array.isArray(resumeData.nowShipping) && resumeData.nowShipping.length >= 2,
  `Now shipping has ${resumeData.nowShipping?.length || 0} entries (expect >= 2)`
);

// ──────────────────────────────
// 4. Overview Cards
// ──────────────────────────────
console.log("\n== Overview Cards ==");
assert(
  Array.isArray(resumeData.overviewCards) && resumeData.overviewCards.length === 3,
  "Exactly 3 overview cards"
);
for (const card of resumeData.overviewCards || []) {
  assert(card.kicker && card.title && card.body, `Card "${card.title}" has kicker, title, body`);
}

// ──────────────────────────────
// 5. Projects
// ──────────────────────────────
console.log("\n== Projects ==");
const expectedProjects = ["OpenClaw / Archer", "SpexInspect", "PawsitiveID", "WiFi Privacy Scanner", "Nash"];
assert(
  Array.isArray(resumeData.projects) && resumeData.projects.length === 5,
  "Exactly 5 projects"
);
for (const name of expectedProjects) {
  const found = (resumeData.projects || []).find((p) => p.name === name);
  assert(found, `Project "${name}" exists`);
  if (found) {
    assert(found.hook && found.hook.length > 10, `"${name}" has meaningful hook`);
    assert(found.detail && found.detail.length > 10, `"${name}" has meaningful detail`);
    assert(Array.isArray(found.tags) && found.tags.length >= 2, `"${name}" has >= 2 tags`);
  }
}

// ──────────────────────────────
// 6. Experience
// ──────────────────────────────
console.log("\n== Experience ==");
const expectedCompanies = ["Deloitte", "Gale Healthcare Solutions", "AgFirst Farm Credit Bank", "Nordstrom"];
assert(
  Array.isArray(resumeData.experience) && resumeData.experience.length === 4,
  "Exactly 4 experience entries"
);
for (const company of expectedCompanies) {
  const found = (resumeData.experience || []).find((e) => e.company === company);
  assert(found, `Experience at "${company}" exists`);
  if (found) {
    assert(found.role, `"${company}" has role`);
    assert(found.period, `"${company}" has period`);
    assert(
      Array.isArray(found.bullets) && found.bullets.length >= 2,
      `"${company}" has >= 2 bullets (has ${found.bullets?.length || 0})`
    );
  }
}

// ──────────────────────────────
// 7. Skill Groups
// ──────────────────────────────
console.log("\n== Skill Groups ==");
const expectedSkillTitles = ["Voice & AI", "Web & Backend", "QA & Automation", "Infrastructure & Leadership", "Recent Upskilling & Certifications"];
assert(
  Array.isArray(resumeData.skillGroups) && resumeData.skillGroups.length === 5,
  "Exactly 5 skill groups"
);
for (const title of expectedSkillTitles) {
  const found = (resumeData.skillGroups || []).find((g) => g.title === title);
  assert(found, `Skill group "${title}" exists`);
  if (found) {
    assert(Array.isArray(found.items) && found.items.length >= 5, `"${title}" has >= 5 items (has ${found.items?.length || 0})`);
  }
}

// ──────────────────────────────
// 8. Sample Prompts
// ──────────────────────────────
console.log("\n== Sample Prompts ==");
assert(
  Array.isArray(resumeData.samplePrompts) && resumeData.samplePrompts.length >= 3,
  `Sample prompts has ${resumeData.samplePrompts?.length || 0} entries (expect >= 3)`
);

// ──────────────────────────────
// 9. Archer Knowledge Coverage
// ──────────────────────────────
console.log("\n== Archer Knowledge Coverage ==");
const archerChecks = [
  ["Why should we hire Ryan?", "Why hire Ryan"],
  ["How many years of QA Automation experience does he have?", "Years of QA Automation experience"],
  ["Does he have experience with AI agents and LLMs?", "AI agents, LLMs, and agentic systems"],
  ["What's his US work authorization?", "US work authorization"],
  ["Does he have ISTQB certification?", "ISTQB and certifications"],
  ["Tell me about OpenClaw.", "OpenClaw"],
  ["Does he have ElevenLabs experience?", "Voice AI and ElevenLabs"],
  ["What is SpexInspect?", "SpexInspect"],
  ["What does he do at Deloitte?", "Deloitte"],
  ["What is his QA background?", "Ryan overview"],
  ["What is he like to work with?", "Work style"],
  ["Can we see code samples?", "Code and technical depth"],
  ["Where is he located and how do we contact him?", "Contact and logistics"],
  ["What salary is he looking for?", "Compensation is handled directly with the hiring team"],
];

for (const [question, expectedSource] of archerChecks) {
  const reply = archerChat.getArcherReply(question);
  assert(
    reply.source === expectedSource,
    `Archer routes "${question.substring(0, 40)}..." -> "${expectedSource}" (got "${reply.source}")`
  );
}

// ──────────────────────────────
// 10. Archer Edge Cases
// ──────────────────────────────
console.log("\n== Archer Edge Cases ==");
const edgeCases = [
  // Should hit fallback
  { q: "What is the meaning of life?", expectFallback: true },
  { q: "asdfgh zxcvbn", expectFallback: true },
  // Should handle compensation
  { q: "What is his salary?", expectCompensation: true },
  { q: "How much does he get paid?", expectCompensation: true },
];

for (const ec of edgeCases) {
  const reply = archerChat.getArcherReply(ec.q);
  if (ec.expectFallback) {
    assert(
      reply.source === "Outside the current grounded knowledge base",
      `Fallback for "${ec.q}" (got "${reply.source}")`
    );
  }
  if (ec.expectCompensation) {
    assert(
      reply.source === "Compensation is handled directly with the hiring team",
      `Compensation redirect for "${ec.q}" (got "${reply.source}")`
    );
  }
}

// ──────────────────────────────
// 11. Data Consistency
// ──────────────────────────────
console.log("\n== Data Consistency ==");
// Sample prompts in resume-data should match archer-chat quick prompts
const rdPrompts = resumeData.samplePrompts || [];
const acPrompts = archerChat.archerQuickPrompts || [];
assert(
  JSON.stringify(rdPrompts) === JSON.stringify(acPrompts),
  `Sample prompts match between resume-data.ts and archer-chat.ts`
);

// All project names in resume-data should have Archer knowledge entries
for (const project of resumeData.projects || []) {
  const reply = archerChat.getArcherReply(`Tell me about ${project.name}`);
  assert(
    reply.source !== "Outside the current grounded knowledge base",
    `Archer knows about project "${project.name}" (source: "${reply.source}")`
  );
}

// ──────────────────────────────
// Summary
// ──────────────────────────────
console.log(`\n${"=".repeat(50)}`);
console.log(`Content Validation: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailed checks:");
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
} else {
  console.log("All content checks passed.");
}
