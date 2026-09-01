# Playwright API Lab ↔ Postman (VS Code extension)

Same test data, two tools. We learn Playwright **and** Postman against the same
APIs with the same requests, payloads, and assertions.

## Layout

```
playwright-api-lab/
├── shared/
│   └── api-data.json            ← SINGLE SOURCE OF TRUTH (edit me)
├── tests/
│   ├── jsonplaceholder-posts.api.spec.ts   ← reads shared data
│   ├── mockapi-items.api.spec.ts           ← reads shared data
│   ├── mockapi-image-upload.api.spec.ts    ← image "upload" (base64 JSON)
│   └── mockapi-filters.api.spec.ts         ← filter/sort/search on products
├── postman/
│   ├── Return-Rover-API-Lab.postman_collection.json   ← generated
│   └── Return-Rover-API-Lab.postman_environment.json  ← generated
├── scripts/
│   └── generate-postman-collection.mjs
└── package.json                 (includes `build:postman` script)
```

## How the sync works

1. All test data (base URLs, payloads, IDs) lives in one file:
   `shared/api-data.json`
2. **Playwright tests** import that file directly — no duplication.
3. **Postman collection** is generated from that same file:

   ```bash
   npm run build:postman
   ```

4. Edit the data, re-run the command, and both tools always see the same
   values. One edit point, two tools in sync.

### One special placeholder: `{{timestamp}}`

The `createItem.name` payload uses `"Symbah {{timestamp}}"` so every run creates
a unique item. Each tool substitutes it at runtime:

| Tool       | Substitution              |
| ---------- | ------------------------- |
| Playwright | `Date.now()` in the test  |
| Postman    | native `{{$timestamp}}` dynamic variable |

(Note: Postman's `{{$timestamp}}` is in seconds, Playwright's `Date.now()` in
milliseconds — same idea, slightly different units. Good thing to know.)

## Getting started in the Postman VS Code extension

1. **Install the extension**
   - VS Code → Extensions panel (`Ctrl+Shift+X`) → search **Postman**
     (publisher: Postman, extension ID `postman.postman-vs-code-extension`).
2. **Import both JSON files** from `postman/`
   - Drag-and-drop `Return-Rover-API-Lab.postman_collection.json` into a Postman
     workspace, or use the **Import** button in the extension.
     (Collection import works in a logged-out / free workspace too.)
   - Do the same for `Return-Rover-API-Lab.postman_environment.json`.
3. **Select the environment** ("Return Rover API Lab") in the environment
   dropdown — this is what resolves `{{jsonplaceholderBaseUrl}}` and
   `{{mockapiBaseUrl}}`.
4. **Run the requests in order within each folder** — the MockAPI folder is a
   workflow: List → **Create** → Get created → Update → **Delete cleanup**.
   The Create request stores `createdItemId` as a collection variable that the
   later requests use (mirrors the Playwright tests' create/verify/cleanup flow).

## Using the Postman web workspace (postman.co)

The same two files import into your cloud workspace, and because the generator
emits **stable IDs**, re-importing a regenerated file **replaces** the existing
collection/environment instead of creating duplicates.

**Recommended: import by dragging the files (no links, no repo visibility
needed).** This works in any browser and never depends on GitHub being public
or the raw CDN being reachable.

1. Open your workspace in the browser and click **Collections** in the left
   sidebar (sometimes the **Overview** landing page hides the Import button;
   you can also use the top-left **Import** control).
2. In File Explorer, grab the two files from `playwright-api-lab/postman/`:
   - `Return-Rover-API-Lab.postman_collection.json`
   - `Return-Rover-API-Lab.postman_environment.json`
3. Drag them **directly onto the Postman browser tab**. A "Choose where to
   import" dialog appears — pick your workspace (e.g. My-Workspace) and confirm.
4. Pick the **Return Rover API Lab** environment from the dropdown (top-right).
5. When you regenerate the files later, drag-and-drop them again — because of
   the stable IDs, it replaces the existing assets instead of making copies.

**Alternative: import from link.** These raw GitHub links work only while the
repo is **public** (if the repo is private, raw fetching 404s and you get
"file not found"). They always point at the latest `main`:

   - Collection: `https://raw.githubusercontent.com/Just-Krisky/Return_Rover/main/playwright-api-lab/postman/Return-Rover-API-Lab.postman_collection.json`
   - Environment: `https://raw.githubusercontent.com/Just-Krisky/Return_Rover/main/playwright-api-lab/postman/Return-Rover-API-Lab.postman_environment.json`

   Paste them into the Import-by-link box, choose your workspace, then use the
   environment dropdown as in step 4.

**Learning bonus:** because base URLs come from *environment variables*, clone
this environment (right-click → Duplicate), rename it `staging`, and point its
base URLs somewhere else (e.g. a MockAPI you control) — the same collection now
hits a different server with zero request edits. That's the concept Postman
calls environments/overrides.

> Tip: if the web app can't reach a request (it asks for an agent), that's the
> browser-sandbox limitation. Install the free **Postman desktop agent** (or the
> desktop app) and re-run — the web UI is otherwise identical.

In the **web workspace**: drag-and-drop the regenerated `postman/*.json` files
again — stable IDs make it a replace, not a duplicate.

## Hand the whole setup to the Postman agent

Two helper commands are built in (no credentials needed for the first):

```bash
npm run handoff          # 1. regenerate + validate + print a paste-ready brief
npm run postman:import   # 2. optional: push collection + env via Postman API
```

**`npm run handoff`** regenerates the Postman files from `shared/api-data.json`,
validates them (stable IDs, all request URLs resolve), writes
`postman/SETUP-BRIEF.md`, and prints a complete brief. Paste that brief into
Postman Agent (or point the agent at `SETUP-BRIEF.md`) — it contains the exact
file paths, import steps, environment selection, folder run order, and known
caveats (like the missing `images` resource).

**`npm run postman:import`** skips the UI entirely and pushes the collection +
environment into a workspace via the Postman API (create-or-update, matching
the stable-ID replace behavior). It needs one-time API access:

1. Postman web app → **Settings → API keys → Create API Key** (workspace-level key is fine)
2. Set it: `set POSTMAN_API_KEY=<your-key>` (PowerShell) or
   `export POSTMAN_API_KEY=<your-key>` (bash), optionally `POSTMAN_WORKSPACE=My-Workspace`
3. Run `npm run postman:import`

No key? Just use drag-and-drop from the section above — the brief tells you the
files either way.

## Re-syncing after a data change

```bash
npm run build:postman          # regenerate postman/*.json
```

Then in the extension: right-click the collection → **Refresh** (if there's no
refresh option, delete and re-import — the extension also watches workspace
collection files if you import them from the repo folder).

## Learning map: same concept in both tools

| Concept            | Playwright                               | Postman                                  |
| ------------------ | ---------------------------------------- | ---------------------------------------- |
| Send a GET         | `request.get(url)`                       | Request tab → GET                        |
| Assert status      | `expect(response.status()).toBe(200)`    | Test tab → `pm.test(...)` + `pm.response.to.have.status(200)` |
| Read a JSON body   | `await response.json()`                  | `pm.response.json()`                     |
| Variables          | TS constants from `api-data.json`        | `{{collectionVariables}}`, environments  |
| Env overrides      | change `baseUrl` in `api-data.json`      | duplicate env, change base URLs          |
| Chaining requests  | variables in the test                    | `pm.collectionVariables.set(...)`        |
| Dynamic data       | `` `Symbah ${Date.now()}` ``             | `"Symbah {{$timestamp}}"`                |
| Cleanup            | `finally { request.delete(...) }`        | Delete request + pre-request guard       |

## Running the Playwright side

```bash
npx playwright test                        # everything
npx playwright test --project=chromium     # fast run, one browser
npm run test:api                           # just the two API specs
```

## Next steps when you're ready

- Add a third API (e.g. PokéAPI or your own MockAPI resource) to
  `shared/api-data.json` → regenerate → both tools pick it up automatically.
- Play with Postman environments: create a `staging` env with a different base
  URL to see overrides in action.
- Try Postman's `pm.response.to.have.jsonSchema()` if you want to compare with
  Playwright's JSON schema matchers.

## Image upload + filters resources (MockAPI)

Two more MockAPI resources are modelled in `shared/api-data.json` and covered by
`mockapi-image-upload.api.spec.ts` and `mockapi-filters.api.spec.ts`.

**The honest caveat:** MockAPI stores **JSON only** — it cannot store a binary
file. So an "image upload" here means a JSON record whose `imageDataBase64`
field holds a `data:` URL (base64) string plus metadata (`name`, `mimeType`,
`width`, `height`, `sizeBytes`, `tags`). The Playwright/Postman tests create
such a record, read it back, verify it round-trips, then clean up.

### Creating the resources in the MockAPI dashboard

MockAPI resources (schemas) are created in the web dashboard
(app.mockapi.io) — there is no public API to create a resource, and it needs
your login. In the project, click **New Resource** and add fields:

**Resource `images`** (image upload records) — exact fields/types to create:
| Field | Type | Example from shared data |
| ----- | ---- | -------------------- |
| name | string | `dr-circuit-cover {{timestamp}}` |
| mimeType | string | `image/png` |
| imageDataBase64 | string | `data:image/png;base64,iVBORw0KGgoAAAAN...` |
| width | number | `4` |
| height | number | `4` |
| sizeBytes | number | `75` |
| tags | string | `cover,test` |

In the MockAPI **New Resource** dialog, add each field one at a time with the
**Add Field** button, choose the exact type, and name it *exactly* as above
(matching `shared/api-data.json`). MockAPI auto-adds `id` for you.

**Resource `products`** (filterable catalog) — exact fields/types to create.
Note the field is `in_stock` (snake_case) — that is what MockAPI's
auto-generated schema actually produces and what the tests seed:
| Field | Type | Example from shared data |
| ----- | ---- | -------------------- |
| name | string | `Dr. Circuit Book 1` |
| category | string | `book` |
| price | number | `12.99` |
| in_stock | boolean | `true` |
| rating | number | `4.8` |
| tags | string | `stem,book` |
| createdAt | string | `2026-01-15` |

That gives you the endpoints `https://6a95ddc0fa33b37f821afa85.mockapi.io/lab/v1/images`
and `.../lab/v1/products`.

> **Status on this workspace:** `products` exists and tests run green. `images`
> still returns **404** as of this check — the image spec skips itself until the
> resource is reachable. To verify you created it in the right project, open
> `https://6a95ddc0fa33b37f821afa85.mockapi.io/lab/v1/images` in your browser —
> a JSON array means it's live; `"Not found"` means it's not in the project
> that endpoint points to. (It's easy to create the resource in the wrong
> MockAPI project — pick the project whose id starts `6a95ddc0fa33b37f821afa85`.)
> Once it 200s, `npm run test:api` stops skipping the image case and the
> Postman Image Upload folder runs.

### Query params you can demo (MockAPI free tier)

- `?search=robot` — full-text search across fields
- `?sortBy=rating&order=desc` — sort descending / ascending
- `?limit=2&page=1` — page size + page (MockAPI only applies `limit` when
  `page` is also present; try `page=2` too)

> From MockAPI's docs, `?filter=field:value` (exact/boolean/numeric-match
> filtering) is a **paid-plan** feature — this workspace returns 404 for it,
> so the lab sticks to the free tier. Good excuse to try it later on a Pro
> workspace.

Run the Playwright side: `npm run test:api` (or the two new specs directly).
Regenerate Postman: `npm run build:postman`. Add rows to the `productsSeed` /
`createImage` objects in `shared/api-data.json` and re-run.