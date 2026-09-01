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

1. Open your workspace in the browser and click **Import** (left sidebar).
2. Paste these raw GitHub links (they always point at the latest `main`):
   - Collection: `https://raw.githubusercontent.com/Just-Krispy/Return_Rover/main/playwright-api-lab/postman/Return-Rover-API-Lab.postman_collection.json`
   - Environment: `https://raw.githubusercontent.com/Just-Krispy/Return_Rover/main/playwright-api-lab/postman/Return-Rover-API-Lab.postman_environment.json`
3. Choose your workspace and confirm. Pick the **Return Rover API Lab**
   environment from the dropdown (top-right).
4. When you regenerate the files later, just re-run the same import — Replace.

**Learning bonus:** because base URLs come from *environment variables*, clone
this environment (right-click → Duplicate), rename it `staging`, and point its
base URLs somewhere else (e.g. a MockAPI you control) — the same collection now
hits a different server with zero request edits. That's the concept Postman
calls environments/overrides.

> Tip: if the web app can't reach a request (it asks for an agent), that's the
> browser-sandbox limitation. Install the free **Postman desktop agent** (or the
> desktop app) and re-run — the web UI is otherwise identical.

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

**Resource `images`** (image upload records)
| Field | Type |
| ----- | ---- |
| name | string |
| mimeType | string |
| imageDataBase64 | string |
| width | number |
| height | number |
| sizeBytes | number |
| tags | string |

**Resource `products`** (filterable catalog)
| Field | Type |
| ----- | ---- |
| name | string |
| category | string |
| price | number |
| inStock | boolean |
| rating | number |
| tags | string |
| createdAt | string |

That gives you the endpoints `https://6a95ddc0fa33b37f821afa85.mockapi.io/lab/v1/images`
and `.../lab/v1/products`.

> **Status on this workspace:** the `products` resource already exists and the
> tests run green. The `images` resource has **not been created yet** — the
> image spec skips itself until you create it in the dashboard; run the two
> URLs above after creating it.

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