/**
 * Typed environment configuration loader.
 *
 * Single source of truth for all environment-driven settings. Reads `.env`
 * (via dotenv), validates every value at load time and exports one frozen,
 * strongly-typed `config` object.
 *
 * Design decisions:
 * - Fail fast: a missing or invalid variable throws at startup, never mid-test.
 * - No `process.env` access outside this file — one place to audit/override.
 * - Frozen: tests cannot accidentally mutate global configuration.
 */
import { config as loadEnv } from 'dotenv';

// Load .env once, when this module is first imported.
loadEnv();

/** Supported deployment targets for the suite. */
export type TestEnvironment = 'demo';

export interface Credentials {
  username: string;
  password: string;
}

export interface Timeouts {
  /** Timeout for one whole test incl. retries-free first run (ms). */
  test: number;
  /** Timeout for a single action: click, fill, etc. (ms). */
  action: number;
  /** Timeout for page navigations (ms). */
  navigation: number;
  /** Timeout for `expect()` assertions (ms). */
  expect: number;
}

export interface AppConfig {
  /** Deployment under test. */
  env: TestEnvironment;
  /** Application base URL — wired into Playwright's `baseURL`. */
  baseUrl: string;
  /** Admin credentials used for login and API setup. */
  credentials: Credentials;
  /** All timeouts in milliseconds. */
  timeouts: Timeouts;
  /** Worker process count. */
  workers: number;
  /** Retries: 0 locally (fail fast), >0 on CI (absorb flakiness). */
  retries: number;
  /** Run browsers headless? Set HEADLESS=false locally to watch. */
  headless: boolean;
  /** True when running on CI (detected via the standard CI env var). */
  isCi: boolean;
}

/** Read a required string variable — throws immediately if missing. */
function requireString(key: string): string {
  const value = process.env[key];
  if (value === undefined || value.trim().length === 0) {
    throw new Error(
      `Missing required environment variable "${key}". ` +
        `Copy .env.example to .env and set a value.`,
    );
  }
  return value.trim();
}

/** Read an optional string variable with a fallback. */
function optionalString(key: string, fallback: string): string {
  const value = process.env[key];
  if (value === undefined || value.trim().length === 0) return fallback;
  return value.trim();
}

/** Read an optional integer variable — throws on non-numeric values. */
function optionalInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw.trim().length === 0) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable "${key}" must be an integer, got "${raw}".`);
  }
  return parsed;
}

/** Read an optional boolean variable ("true"/"false", case-insensitive). */
function optionalBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw.trim().length === 0) return fallback;
  return raw.trim().toLowerCase() === 'true';
}

/** Narrow the raw TEST_ENV string into a supported environment literal. */
function parseEnvironment(raw: string): TestEnvironment {
  if (raw !== 'demo') {
    throw new Error(
      `Unsupported TEST_ENV "${raw}". Supported values: demo ` +
        `(extend TestEnvironment in src/config/env.ts to add more).`,
    );
  }
  return raw;
}

function loadConfig(): AppConfig {
  const isCi = process.env.CI === 'true' || process.env.CI === '1';

  return {
    env: parseEnvironment(optionalString('TEST_ENV', 'demo')),
    baseUrl: optionalString('BASE_URL', 'https://opensource-demo.orangehrmlive.com'),
    credentials: {
      username: requireString('ADMIN_USERNAME'),
      password: requireString('ADMIN_PASSWORD'),
    },
    timeouts: {
      test: optionalInt('TEST_TIMEOUT', 90_000),
      action: optionalInt('ACTION_TIMEOUT', 20_000),
      navigation: optionalInt('NAVIGATION_TIMEOUT', 30_000),
      expect: optionalInt('EXPECT_TIMEOUT', 10_000),
    },
    // 2 workers: 4 parallel browsers demonstrably stall this shared demo
    // server (same tests pass alone but fail under 4-worker load).
    workers: optionalInt('WORKERS', 2),
    // 1 retry locally: this shared demo server randomly stalls >30s on
    // navigation (verified repeatedly — different tests each time, all
    // passing on immediate rerun). Genuine failures still fail all
    // attempts; only transient stalls are absorbed.
    retries: optionalInt('RETRIES', isCi ? 2 : 1),
    headless: optionalBool('HEADLESS', true),
    isCi,
  };
}

/** Recursively freeze an object so nothing can mutate it at runtime. */
function deepFreeze<T extends object>(target: T): Readonly<T> {
  for (const key of Object.keys(target) as Array<keyof T>) {
    const value: T[keyof T] = target[key];
    if (typeof value === 'object' && value !== null) deepFreeze(value as object);
  }
  return Object.freeze(target);
}

/** Framework-wide configuration — import this, never process.env directly. */
export const config: Readonly<AppConfig> = deepFreeze(loadConfig());
