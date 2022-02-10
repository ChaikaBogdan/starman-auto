import { expect, Locator, Page } from "@playwright/test";

export class Sandbox {
  readonly page: Page;
  readonly gameSelector: Locator;
  readonly gameSearch: Locator;
  readonly mobileSwitch: Locator;

  constructor(page: Page) {
    this.page = page;
    this.gameSelector = page.locator(
      'button[role="button"]:has-text("gamename")'
    );
    this.gameSearch = page.locator('[aria-label="Search"]');
    this.mobileSwitch = page.locator(
      "text=Mobile ONOFF >> :nth-match(label, 3)"
    );
  }

  async goto() {
    await this.page.goto("/");
    await expect(this.page).toHaveTitle(/sanbox/);
  }

  async waitForConfig() {
    await this.page.waitForResponse(
      (resp) =>
        resp.url().includes("/sandbox/") && resp.status() === 200
    );
  }

  async select(game) {
    await this.gameSelector.click();
    await this.page.click(`a[role="option"]:has-text("${game}")`);
    await this.mobileSwitch.click();
  }
  
  // NOTE: swithching to new tab with game
  async startAndSwitch() {
    const [page1] = await Promise.all([
      this.page.waitForEvent("popup"),
      this.page.click("text=Open"),
    ]);
    return page1;
  }
}
