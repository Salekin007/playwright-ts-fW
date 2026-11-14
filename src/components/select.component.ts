import type { Locator } from '@playwright/test';

/**
 * Reusable component: OrangeHRM's custom dropdown (NOT a native <select>).
 *
 * Takes a LOCATOR: the ".oxd-select-wrapper" of one field. Verified live:
 * clicking the wrapper opens a dropdown with role="listbox" whose options
 * carry role="option" ("-- Select --", "Admin", "ESS", ...) — so the
 * interaction is fully semantic despite the fake-select markup.
 *
 * The dropdown renders page-scoped and only ONE is open at a time
 * (opening a select closes the previous — verified behaviour), hence
 * root.page() for the listbox lookup.
 *
 * Component contract: actions only, zero assertions.
 */
export class SelectComponent {
  private readonly root: Locator;

  /** @param root the ".oxd-select-wrapper" of one dropdown field. */
  constructor(root: Locator) {
    this.root = root;
  }

  /** The currently open dropdown (role=listbox). */
  get dropdown(): Locator {
    return this.root.page().getByRole('listbox');
  }

  /** The value currently shown in the select (its wrapper text). */
  async selectedValue(): Promise<string> {
    return (await this.root.innerText()).trim();
  }

  /**
   * Open the dropdown and pick an option by its exact visible name.
   * Auto-waits: click waits for the wrapper, option click waits for the
   * dropdown to have rendered the matching option.
   */
  async select(option: string): Promise<void> {
    await this.root.click();
    await this.dropdown.getByRole('option', { name: option, exact: true }).click();
  }
}
