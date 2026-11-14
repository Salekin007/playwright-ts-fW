# OrangeHRM — Playwright + TypeScript Automation Framework

Production-style UI test automation framework for the
[OrangeHRM demo application](https://opensource-demo.orangehrmlive.com), built to
demonstrate how a senior SDET structures a real automation project.

## Highlights

- **Page Object Model** with strict separation: pages, components, fixtures, helpers, data, API clients
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

## Prerequisites

- Node.js ≥ 18
- npm
- Allure CLI (optional): `brew install allure`

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

## Commands

| Command                   | What it does                               |
| ------------------------- | ------------------------------------------ |
| `npm test`                | Run all tests (headless)                   |
| `npm run test:headed`     | Run all tests with a visible browser       |
| `npm run test:debug`      | Run in Playwright Inspector (step-by-step) |
| `npm run test:ui`         | Run in Playwright UI mode                  |
| `npm run test:smoke`      | Only tests tagged `@smoke`                 |
| `npm run test:regression` | Everything except `@smoke`                 |
| `npm run report`          | Open the HTML report                       |
| `npm run typecheck`       | `tsc --noEmit` strict type check           |
| `npm run lint`            | ESLint                                     |
| `npm run format`          | Prettier write                             |

## Project Structure

```
├── playwright.config.ts       # Projects, retries, artifacts, baseURL
├── .env.example               # Template for local configuration
├── src/
│   ├── config/env.ts          # Typed config loader (fail-fast, frozen)
│   ├── pages/                 # Page objects — locators + actions only
│   │   ├── base.page.ts
│   │   ├── login.page.ts
│   │   ├── dashboard.page.ts
│   │   ├── admin/system-users.page.ts
│   │   ├── pim/add-employee.page.ts
│   │   ├── pim/employee-list.page.ts
│   │   └── leave/apply-leave.page.ts
│   ├── components/            # Reusable widgets (sidebar, toast, dropdown…)
│   ├── fixtures/              # test.extend — DI for pages, session, data
│   ├── helpers/               # Random data, date utilities
│   ├── data/                  # Typed test data + factories
│   └── api/                   # API clients for fast setup/cleanup
├── tests/                     # Specs — assertions and test.step only
│   ├── auth/  admin/  pim/  leave/  dashboard/  smoke/
└── .auth/                     # storageState session file (gitignored)
```

## Configuration

All settings come from `.env` (see `.env.example`). Every value is validated at
startup by `src/config/env.ts` — a bad config fails the run immediately, never
a test halfway through.

## Reporting

- **HTML**: `npm run report` (served from `playwright-report/`)
- **Allure**: results are generated on every run into `allure-results/`; view with `npx allure serve allure-results`

## Conventions

- Locators: role/label-based first (`getByRole`, `getByLabel`, `getByPlaceholder`)
- No `waitForTimeout` — auto-waiting + web-first assertions only
- No assertions inside page objects — assertions belong to tests
- No shared mutable state — fixtures provide fresh instances per test
- Tags in titles: `@smoke`, `@regression`
