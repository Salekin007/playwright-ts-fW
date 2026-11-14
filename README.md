# OrangeHRM — Playwright + TypeScript Automation Framework

Production-style UI test automation framework for the
[OrangeHRM demo application](https://opensource-demo.orangehrmlive.com), built to
demonstrate how a senior SDET structures a real automation project.

## Highlights

- **Page Object Model** with strict separation: pages, components, fixtures, data, API clients
- **Custom fixtures** (`test.extend`) as a dependency-injection layer for page objects, authenticated sessions and test data
- **Session reuse** via `storageState` — log in once, reuse everywhere
- **API-assisted setup/cleanup** using Playwright's request context
- **Typed everything** — strict TypeScript, typed env config, zero `any`
- **Unique data per test** — fully independent, order-free, parallel-safe tests

## Tech Stack

| Purpose     | Tool                                        |
| ----------- | ------------------------------------------- |
| Test runner | Playwright (`@playwright/test`)             |
| Language    | TypeScript (strict mode)                    |
| Config      | dotenv + typed loader (`src/config/env.ts`) |
| Linting     | ESLint 9 (flat config) + typescript-eslint  |
| Formatting  | Prettier                                    |
| Reporting   | Built-in HTML reporter + Allure             |

## Project Structure

```
├── playwright.config.ts        # Projects, retries, timeouts, artifacts, baseURL
├── .env.example                # Template for local configuration (copy to .env)
├── src/
│   ├── api/                    # API clients for fast test-data setup & cleanup
│   ├── components/             # Reusable widget objects (sidebar, toast, date-picker, select…)
│   ├── config/                 # Typed, frozen, fail-fast env loader + constants
│   ├── data/                   # Test data & factories — unique data per run
│   ├── fixtures/               # test.extend DI — auth, app pages, PIM/Admin API fixtures
│   └── pages/                  # Page objects — locators + actions only, zero assertions
├── tests/                      # Specs by module — assertions live here only
│   ├── auth/                   # Login/logout + storageState setup project
│   ├── smoke/                  # Critical-path navigation across modules
│   ├── pim/                    # Add / search / edit / delete employee
│   ├── admin/                  # User management: create, search, filter by role
│   ├── leave/                  # Apply-leave confirmation flow, leave list
│   └── dashboard/              # Widgets & quick-launch navigation
└── .auth/                      # storageState session file (gitignored)
```

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install chromium

# 3. Create your local env file
cp .env.example .env

# 4. Run the suite
npm test
```

## Environment Variables

All configuration lives in `.env` (never committed). `src/config/env.ts` validates
every value at startup — a bad config fails the run immediately, never a test
halfway through.

| Variable              | Purpose                                            | Default in `.env.example`                  |
| --------------------- | -------------------------------------------------- | ------------------------------------------ |
| `TEST_ENV`            | Deployment under test                              | `demo`                                     |
| `BASE_URL`            | Application under test                             | `https://opensource-demo.orangehrmlive.com` |
| `ADMIN_USERNAME`      | Login username (public demo credential)            | `Admin`                                    |
| `ADMIN_PASSWORD`      | Login password (public demo credential)            | `admin123`                                 |
| `TEST_TIMEOUT`        | Budget for one test (ms) — shared server is slow   | `90000`                                    |
| `ACTION_TIMEOUT`      | Budget for one action (ms)                         | `20000`                                    |
| `NAVIGATION_TIMEOUT`  | Budget for one navigation (ms)                     | `30000`                                    |
| `EXPECT_TIMEOUT`      | Budget for one `expect()` (ms)                     | `10000`                                    |
| `WORKERS`             | Parallel workers — kept low, the demo site is shared infra | `2`                              |
| `HEADLESS`            | `false` locally to watch the browser               | `true`                                     |
| `RETRIES`             | Optional override (CI forces `2`)                  | `1` local                                  |

## Commands

| Command                                             | What it does                               |
| --------------------------------------------------- | ------------------------------------------ |
| `npm test`                                          | Run all tests (headless)                   |
| `npm run test:smoke`                                | Only tests tagged `@smoke`                 |
| `npm run test:regression`                           | Everything except `@smoke`                 |
| `npx playwright test tests/pim/add-employee.spec.ts`| Run a single spec file                     |
| `npx playwright test --grep "searching by username"` | Run tests matching a title substring       |
| `npm run test:headed`                               | Run all tests with a visible browser       |
| `npm run test:debug`                                | Run in Playwright Inspector (step-by-step) |
| `npm run test:ui`                                   | Run in Playwright UI mode                  |
| `npm run report`                                    | Open the HTML report                       |
| `npm run typecheck`                                 | `tsc --noEmit` strict type check           |
| `npm run lint`                                      | ESLint                                     |
| `npm run format`                                    | Prettier write                             |

## Reporting

### HTML Report

`npm test` writes a detailed report (traces, videos, screenshots of failures)
into `playwright-report/` — open it with `npm run report`.

> 📸 _Screenshot placeholder — run the suite, capture the report, save it as
> `docs/screenshots/html-report.png`, then uncomment:_

<!-- ![Playwright HTML report](docs/screenshots/html-report.png) -->

### Allure

Every run also writes Allure data into `allure-results/` (gitignored). View it
with `npx allure serve allure-results` (requires the
[Allure CLI](https://allurereport.org/docs/install/)).

## Design Decisions

1. **Fixture-based auth, not project-level `storageState`.** The session is
   injected as an `authenticatedPage` fixture. Auth specs need an *anonymous*
   page — project-level storage state would silently break them.
2. **Zero assertions in page objects.** Pages expose state and actions; specs
   own assertions. Tests stay the single place where pass/fail is decided.
3. **Components take a `Locator`, not a `Page`.** Widgets (toast, sidebar,
   date-picker…) compose into any page without knowing about the page itself.
4. **API layer for setup/cleanup.** Employee/user records are created and
   deleted through the API; the UI is only exercised for the behavior under
   test. Faster, more stable, no test-data drift.
5. **Typed, frozen, fail-fast config.** `src/config/env.ts` validates and
   freezes the environment before the first test starts.
6. **Unique generated data per test.** Every test creates its own records —
   tests are order-free, parallel-safe, and never fight over shared data.
7. **Evidence-based resilience.** Retries (1 local / 2 CI), 2 workers and
   generous timeouts come from measured behavior of the shared demo server,
   not guesswork.
8. **`@smoke` / `@regression` tags.** Cheap suite selection for CI gating:
   smoke on pull requests, full suite on `main`.
9. **Artifacts only on failure.** Traces, videos and screenshots are retained
   for failures — full fidelity for debugging, near-zero cost for green runs.
10. **Honest coverage boundaries.** What the demo app genuinely does not allow
    (e.g. leave entitlement writes) is documented, not faked — the framework
    never pretends a gap is covered.

## Conventions

- Locators: role/label-based first (`getByRole`, `getByLabel`, `getByPlaceholder`)
- No `waitForTimeout` — auto-waiting + web-first assertions only
- No assertions inside page objects — assertions belong to tests
- No shared mutable state — fixtures provide fresh instances per test
- Tags in titles: `@smoke`, `@regression`
