import type { Locator, Page } from '@playwright/test';

/** Toast variants OrangeHRM renders (class suffix on .oxd-toast--{type}). */
export type ToastType = 'success' | 'error' | 'warn' | 'info';

/**
 * Reusable component: toast notifications (bottom-right popups).
 *
 * Takes a Page because toasts render in a page-root container, outside
 * any form/table region.
 *
 * Verified live (My Info no-op save):
 *  - root: .oxd-toast, carries aria-live="assertive" (no role attribute,
 *    so getByRole('alert') does NOT resolve it)
 *  - variant is a class suffix: .oxd-toast.oxd-toast--success
 *  - innerText = "<Title>\n\n<Message>\n\n×" e.g. "Success\n\nSuccessfully Updated\n\n×"
 *  The success suffix was verified against the live app; error/warn/info
 *  follow OrangeHRM's own documented toast types and will be exercised by
 *  module tests as they appear.
 *
 * "Waiting" here means Locator.waitFor — a condition-based wait on a
 * specific element, never a fixed sleep.
 */
export class ToastComponent {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Toast element, optionally filtered to one variant. */
  toast(type?: ToastType): Locator {
    return type
      ? this.page.locator(`.oxd-toast.oxd-toast--${type}`)
      : this.page.locator('.oxd-toast');
  }

  /** Wait (auto-wait, no timeout sleep) for a toast of a variant to appear. */
  async waitFor(type?: ToastType): Promise<void> {
    await this.toast(type).waitFor({ state: 'visible' });
  }

  /**
   * Read the toast text (title + message + close glyph, as rendered).
   * Specs assert on this with toContainText for the part they care about.
   */
  async getText(type?: ToastType): Promise<string> {
    return (await this.toast(type).innerText()).trim();
  }
}
