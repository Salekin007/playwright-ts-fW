import type { Locator } from '@playwright/test';

/**
 * Format a Date exactly the way OrangeHRM displays and commits dates.
 *
 * VERIFIED AGAINST THE LIVE APP (do not "fix" to ISO!): picking day 15 of
 * November 2026 in the popup commits "2026-15-11" — the app's format is
 * literally yyyy-dd-mm (year-day-month), matching its "yyyy-dd-mm"
 * placeholder. Filling an ISO yyyy-mm-dd string silently produces a
 * wrong or unparseable date for days where day/month could swap.
 */
export function formatAsOrangeHrmDate(date: Date): string {
  const year = date.getFullYear();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${day}-${month}`;
}

/**
 * Reusable component: an OrangeHRM date input (calendar icon field).
 *
 * Takes a LOCATOR, not a Page: date inputs are region-scoped — a page can
 * contain several of them (e.g. Leave's From/To). The root is the
 * ".oxd-date-input" wrapper that owns the input and its calendar popup
 * (popup class ".oxd-date-input-calendar", day cells ".oxd-calendar-date"
 * — kept here as comments for a future pickFromPopup() API if a test
 * ever needs to drive the calendar UI itself).
 *
 * Component contract: actions only, zero assertions.
 */
export class DatePickerComponent {
  private readonly root: Locator;

  /** @param root the ".oxd-date-input" wrapper around the input. */
  constructor(root: Locator) {
    this.root = root;
  }

  private get input(): Locator {
    return this.root.locator('input');
  }

  /**
   * Type a date and commit it.
   *
   * Enter commits the typed value and closes the calendar popup (verified
   * live: no popup element remains after Enter). The value is formatted
   * with formatAsOrangeHrmDate — see its warning about yyyy-dd-mm.
   */
  async set(date: Date): Promise<void> {
    await this.input.fill(formatAsOrangeHrmDate(date));
    await this.input.press('Enter');
  }
}
