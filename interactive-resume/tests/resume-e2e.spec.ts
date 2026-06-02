/**
 * Interactive Resume — Full E2E Test Suite
 *
 * Covers: page load, navigation, content completeness, Archer conversation
 * (voice + text), contact links, PDF download, print page, accessibility,
 * SEO/meta tags, and visual snapshot checks.
 *
 * Run:  npx playwright test
 * URL:  BASE_URL=http://localhost:3000 npx playwright test   (for local dev)
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL || "https://interactive-resume-tan.vercel.app";

/* ──────────────────────────────
 * 1. Page Load & Core Structure
 * ────────────────────────────── */

test("page loads with correct title", async ({ page }) => {
  await page.goto(BASE);
  await expect(page).toHaveTitle(/Ryan C\. Bradford/);
});

test("h1 contains full name", async ({ page }) => {
  await page.goto(BASE);
  const h1 = page.locator("h1");
  await expect(h1).toHaveText("Ryan C. Bradford");
});

test("tagline is visible in header", async ({ page }) => {
  await page.goto(BASE);
  const tagline = page.locator(".brand-role");
  await expect(tagline).toContainText("Lead QA Automation Engineer");
});

/* ──────────────────────────────
 * 2. Navigation
 * ────────────────────────────── */

const NAV_SECTIONS = [
  { label: "Overview", id: "overview" },
  { label: "Projects", id: "projects" },
  { label: "Experience", id: "experience" },
  { label: "Skills", id: "skills" },
];

for (const { label, id } of NAV_SECTIONS) {
  test(`nav link "${label}" scrolls to #${id}`, async ({ page }) => {
    await page.goto(BASE);
    const link = page.locator(`nav >> text=${label}`);
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.locator(`#${id}`)).toBeInViewport();
  });
}

/* ──────────────────────────────
 * 3. Content Sections Exist
 * ────────────────────────────── */

test("overview section has 3 story cards", async ({ page }) => {
  await page.goto(BASE);
  const cards = page.locator("#overview .story-card");
  await expect(cards).toHaveCount(3);
});

test("projects section has 5 project cards", async ({ page }) => {
  await page.goto(BASE);
  const cards = page.locator("#projects .project-card");
  await expect(cards).toHaveCount(5);
});

test("experience section has 4 timeline cards", async ({ page }) => {
  await page.goto(BASE);
  const cards = page.locator("#experience .timeline-card");
  await expect(cards).toHaveCount(4);
});

test("skills section has 5 skill groups", async ({ page }) => {
  await page.goto(BASE);
  const groups = page.locator("#skills .skill-card");
  await expect(groups).toHaveCount(5);
});

test("hero stat cards are present", async ({ page }) => {
  await page.goto(BASE);
  const stats = page.locator(".stat-card");
  await expect(stats).toHaveCount(3);
});

test("now-shipping list has entries", async ({ page }) => {
  await page.goto(BASE);
  const items = page.locator(".now-shipping-list li");
  await expect(items).toHaveCount(3);
});

/* ──────────────────────────────
 * 4. Project Content Specifics
 * ────────────────────────────── */

const EXPECTED_PROJECTS = [
  "OpenClaw / Archer",
  "SpexInspect",
  "PawsitiveID",
  "WiFi Privacy Scanner",
  "Nash",
];

for (const name of EXPECTED_PROJECTS) {
  test(`project "${name}" is listed`, async ({ page }) => {
    await page.goto(BASE);
    const heading = page.locator(`#projects h3 >> text="${name}"`);
    await expect(heading).toBeVisible();
  });
}

/* ──────────────────────────────
 * 5. Experience Content
 * ────────────────────────────── */

const EXPECTED_ROLES = [
  "QA Lead Engineer, Omnia Platform",
  "QA Lead Engineer",
  "Sr. System Administrator",
  "System Administrator",
];

for (const role of EXPECTED_ROLES) {
  test(`experience role "${role}" is listed`, async ({ page }) => {
    await page.goto(BASE);
    const heading = page.locator(`#experience h3 >> text="${role}"`);
    await expect(heading).toBeVisible();
  });
}

/* ──────────────────────────────
 * 6. Archer Conversation Dock
 * ────────────────────────────── */

test("Archer FAB button is visible", async ({ page }) => {
  await page.goto(BASE);
  const fab = page.locator('button[aria-label="Open Archer conversation"]');
  await expect(fab).toBeVisible();
});

test("Archer dialog opens on FAB click", async ({ page }) => {
  await page.goto(BASE);
  const fab = page.locator('button[aria-label="Open Archer conversation"]');
  await fab.click();
  const dialog = page.locator('.assistant-dock[role="dialog"]');
  await expect(dialog).toBeVisible();
});

test("Archer dialog has Voice and Text tabs", async ({ page }) => {
  await page.goto(BASE);
  await page.locator('button[aria-label="Open Archer conversation"]').click();
  const tabs = page.locator(".assistant-tab");
  await expect(tabs).toHaveCount(2);
  await expect(tabs.nth(0)).toContainText("Voice");
  await expect(tabs.nth(1)).toContainText("Text");
});

test("Archer text mode shows opening line", async ({ page }) => {
  await page.goto(BASE);
  await page.locator('button[aria-label="Open Archer conversation"]').click();
  // Click the Text fallback tab
  await page.locator('.assistant-tab >> text="Text fallback"').click();
  const opening = page.locator(".message-card.is-assistant").first();
  await expect(opening).toContainText("Archer");
});

test("Archer text mode can submit a question and get a reply", async ({ page }) => {
  await page.goto(BASE);
  await page.locator('button[aria-label="Open Archer conversation"]').click();
  await page.locator('.assistant-tab >> text="Text fallback"').click();

  const input = page.locator("#archer-question");
  await input.fill("Tell me about OpenClaw");
  await page.locator(".assistant-submit").click();

  // Should have at least 3 messages now (opening + user question + reply)
  const messages = page.locator(".message-card");
  await expect(messages).toHaveCount(3, { timeout: 5000 });

  // The assistant reply should mention OpenClaw
  const reply = page.locator(".message-card.is-assistant").last();
  await expect(reply).toContainText("OpenClaw");
});

test("Archer quick prompt chips submit on click", async ({ page }) => {
  await page.goto(BASE);
  await page.locator('button[aria-label="Open Archer conversation"]').click();
  // Click a quick prompt chip
  const chip = page.locator(".assistant-prompt-chip").first();
  const chipText = await chip.textContent();
  await chip.click();

  // Should be in text mode with messages
  const messages = page.locator(".message-card");
  await expect(messages).toHaveCount(3, { timeout: 5000 });
});

test("Archer dialog closes on Escape", async ({ page }) => {
  await page.goto(BASE);
  await page.locator('button[aria-label="Open Archer conversation"]').click();
  const dialog = page.locator('.assistant-dock[role="dialog"]');
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("Archer dialog closes on X button", async ({ page }) => {
  await page.goto(BASE);
  await page.locator('button[aria-label="Open Archer conversation"]').click();
  await page.locator('button[aria-label="Close Archer conversation"]').click();
  const dialog = page.locator('.assistant-dock[role="dialog"]');
  await expect(dialog).not.toBeVisible();
});

/* ──────────────────────────────
 * 7. Contact Links
 * ────────────────────────────── */

test("footer has email link", async ({ page }) => {
  await page.goto(BASE);
  const email = page.locator('a[href^="mailto:"]');
  await expect(email).toHaveCount(1);
  await expect(email).toHaveAttribute("href", /ryan\.c\.bradford@/);
});

test("footer has phone link", async ({ page }) => {
  await page.goto(BASE);
  const phone = page.locator('a[href^="tel:"]');
  await expect(phone).toHaveCount(1);
});

test("footer has LinkedIn link", async ({ page }) => {
  await page.goto(BASE);
  const linkedin = page.locator('a[href*="linkedin.com"]');
  await expect(linkedin).toHaveCount(1);
});

test("footer has GitHub link", async ({ page }) => {
  await page.goto(BASE);
  const github = page.locator('a[href*="github.com/Just-Krispy"]');
  await expect(github).toHaveCount(1);
});

/* ──────────────────────────────
 * 8. PDF Download
 * ────────────────────────────── */

test("Download PDF link exists in header and footer", async ({ page }) => {
  await page.goto(BASE);
  const pdfLinks = page.locator('a[href*="Ryan_Bradford_Resume.pdf"]');
  await expect(pdfLinks).toHaveCount(2);
});

test("PDF file is accessible", async ({ request }) => {
  const resp = await request.get(`${BASE}/resume/Ryan_Bradford_Resume.pdf`);
  expect(resp.status()).toBe(200);
  expect(resp.headers()["content-type"]).toContain("pdf");
});

/* ──────────────────────────────
 * 9. Print Page
 * ────────────────────────────── */

test("print page loads successfully", async ({ page }) => {
  await page.goto(`${BASE}/print`);
  await expect(page).toHaveTitle(/Ryan/);
});

/* ──────────────────────────────
 * 10. SEO & Meta Tags
 * ────────────────────────────── */

test("page has meta description", async ({ page }) => {
  await page.goto(BASE);
  const desc = page.locator('meta[name="description"]');
  await expect(desc).toHaveAttribute("content", /QA automation/);
});

test("page has Open Graph tags", async ({ page }) => {
  await page.goto(BASE);
  const ogTitle = page.locator('meta[property="og:title"]');
  await expect(ogTitle).toHaveAttribute("content", /Ryan C\. Bradford/);
});

test("page has Twitter card tags", async ({ page }) => {
  await page.goto(BASE);
  const twitterCard = page.locator('meta[name="twitter:card"]');
  await expect(twitterCard).toHaveAttribute("content", "summary_large_image");
});

test("html has lang attribute", async ({ page }) => {
  await page.goto(BASE);
  const html = page.locator("html");
  await expect(html).toHaveAttribute("lang", "en");
});

test("viewport meta tag is set", async ({ page }) => {
  await page.goto(BASE);
  const viewport = page.locator('meta[name="viewport"]');
  await expect(viewport).toHaveCount(1);
});

/* ──────────────────────────────
 * 11. Accessibility Basics
 * ────────────────────────────── */

test("nav has aria-label", async ({ page }) => {
  await page.goto(BASE);
  const nav = page.locator("nav");
  await expect(nav).toHaveAttribute("aria-label", "Resume sections");
});

test("Archer dialog has aria-modal", async ({ page }) => {
  await page.goto(BASE);
  await page.locator('button[aria-label="Open Archer conversation"]').click();
  const dialog = page.locator('.assistant-dock[role="dialog"]');
  await expect(dialog).toHaveAttribute("aria-modal", "true");
});

test("Archer input has associated label", async ({ page }) => {
  await page.goto(BASE);
  await page.locator('button[aria-label="Open Archer conversation"]').click();
  await page.locator('.assistant-tab >> text="Text fallback"').click();
  const label = page.locator('label[for="archer-question"]');
  await expect(label).toBeVisible();
});

/* ──────────────────────────────
 * 12. Visual / Layout Checks
 * ────────────────────────────── */

test("page does not have console errors on load", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto(BASE);
  await page.waitForLoadState("networkidle");
  // Filter out known benign errors (e.g., ElevenLabs widget)
  const realErrors = errors.filter(
    (e) => !e.includes("elevenlabs") && !e.includes("convai")
  );
  expect(realErrors).toHaveLength(0);
});

test("page is not blank — has meaningful content length", async ({ page }) => {
  await page.goto(BASE);
  const body = page.locator("body");
  const text = await body.textContent();
  expect(text.length).toBeGreaterThan(500);
});

test("no broken internal section anchors", async ({ page }) => {
  await page.goto(BASE);
  const navLinks = page.locator("nav a[href^='#']");
  const count = await navLinks.count();
  for (let i = 0; i < count; i++) {
    const href = await navLinks.nth(i).getAttribute("href");
    if (href) {
      const target = page.locator(href);
      await expect(target).toBeAttached();
    }
  }
});
