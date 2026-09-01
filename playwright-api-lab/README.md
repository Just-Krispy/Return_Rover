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
│   └── mockapi-items.api.spec.ts           ← reads shared data
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