import type { Locator } from '@playwright/test';

/**
 * Reusable component: OrangeHRM's "Type for hints..." autocomplete field.
 *
 * Takes a LOCATOR, not a Page: autocomplete inputs are field-scoped (a
 * form can contain several). The root is the ".oxd-autocomplete-wrapper"
 * that owns the input, the dropdown and its options.
 *
 * Verified live (Leave > Apply, Employee Name):
 *  - dropdown: role="listbox", options: role="option" -> semantic locators
 *  - the dropdown FIRST renders a "Searching...." pseudo-option while the
 *    API call is in flight — a naive wait grabs that instead of results,
 *    so option locators must exclude it
 *  - duplicate options exist (three identical "John William Doe" rows on
 *    the demo data) — matching uses .first() deliberately
 *  - clicking an option commits its full text into the input
 *
 * Component contract: actions only, zero assertions.
 */
export class AutocompleteComponent {
  private readonly root: Locator;

  /** @param root the ".oxd-autocomplete-wrapper" around the input. */
  constructor(root: Locator) {
    this.root = root;
  }

  private get input(): Locator {
    return this.root.locator('input');
  }

  /** The results dropdown (role=listbox). */
  get dropdown(): Locator {
    return this.root.getByRole('listbox');
  }

  /** Real options, with the transient "Searching...." pseudo-option excluded. */
  options(): Locator {
    return this.dropdown.getByRole('option').filter({ hasNotText: /searching/i });
  }

  /**
   * Type a query and pick a matching option.
   *
   * @param query text to type (a short fragment triggers the search API)
   * @param optionName text (or pattern) of the option to click; first
   *        match wins because duplicates are possible
   */
  async select(query: string, optionName: string | RegExp): Promise<void> {
    await this.input.fill(query);

    const target = this.options().filter({ hasText: optionName }).first();
    // Auto-waits through "Searching...." until a real, matching option exists.
    await target.waitFor({ state: 'visible' });
    await target.click();
  }
}
