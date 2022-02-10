import { expect, Locator, Page, WebSocket } from "@playwright/test";

export class LiveCrash {
  readonly page: Page;
  readonly sessionURL: string;
  readonly username: Locator;
  readonly chatSendMessage: Locator;
  readonly chatOpen: Locator;
  readonly chatInput: Locator;
  readonly historyOpen: Locator;
  readonly minimalBet: Locator;
  readonly winInNav: Locator;
  readonly menuOpen: Locator;
  readonly winInHistory: Locator;
  readonly statusBar: Locator;
  readonly assets: Array<string>;
  socket: WebSocket;

  constructor(page: Page, sessionURL: string) {
    this.page = page;
    this.sessionURL = sessionURL;
    this.username = page.locator(
      '[placeholder="Please\\ pick\\ a\\ nickname\\ to\\ play"]'
    );
    this.chatOpen = page.locator("text=CLICK TO CHAT");
    this.chatInput = page.locator('[placeholder="Type\\ a\\ message"]');
    this.chatSendMessage = page.locator("text=Chat😉 >> button");
    this.menuOpen = page.locator("button");
    this.minimalBet = page.locator("text=CASHOUT AT×1.10");
    this.winInNav = page.locator("text=Fun 0.01");
    this.historyOpen = page.locator("text=History");
    this.winInHistory = page.locator(
      '//*[@id="root"]/div/div[2]/div[5]/div[1]/div/div/div/div/div[2]/div'
    );
    this.statusBar = page.locator('//*[@id="root"]/div/div[2]/div[1]')
    this.socket = null;

    //TODO: Its not a full list
    this.assets = [
      "assets/image/image.atlas",
    ];
  }

  async goto() {
    await this.page.goto(this.sessionURL);
    await expect(this.page).toHaveTitle('Title');
  }

  async waitForLoad() {
    await this.page.waitForLoadState();
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle");
  }

  async fillUsername(username) {
    await this.username.click();
    await this.username.fill(username);
    await this.page.click("text=Enter");
  }

  async openChat() {
    await this.chatOpen.click();
  }

  async openMenu() {
    await this.menuOpen.first().click();
  }

  async sendChatMessage(message) {
    await this.chatInput.fill(message);
    await this.chatSendMessage.click();
  }

  async checkChatMessage(username) {
    await expect(
      this.page.locator(`:nth-match(:text("${username}"), 2)`)
    ).toBeVisible();
  }

  async openHistory() {
    await this.historyOpen.click();
  }

  async checkWinInHistory() {
    await expect(this.winInHistory).toBeVisible();
  }

  async checkWinInNav() {
    await expect(this.winInNav.first()).toBeVisible();
  }

  async betMininum() {
    await this.minimalBet.click();
  }

  async waitForIncomingWin() {
    return new Promise((resolve) =>
      this.socket
        .waitForEvent("framereceived", this.isWinIncoming)
        .then(() => resolve("incomingWin"))
    );
  }

  async waitForOutcomingBet() {
    return new Promise((resolve) =>
      this.socket
        .waitForEvent("framesent", this.isBetOutcoming)
        .then(() => resolve("outcomingBet"))
    );
  }

  async waitForIncomingChatMessage() {
    return new Promise((resolve) =>
      this.socket
        .waitForEvent("framereceived", this.isChatMessageIncoming)
        .then(() => resolve("incomingChat"))
    );
  }

  async waitForIncomingHistory() {
    return new Promise((resolve) =>
      this.socket
        .waitForEvent("framereceived", this.isHistoryIncoming)
        .then(() => resolve("incomingHistory"))
    );
  }

  async waitForOutcomingChatMessage() {
    return new Promise((resolve) =>
      this.socket
        .waitForEvent("framesent", this.isChatMessageOutcoming)
        .then(() => resolve("outcomingChat"))
    );
  }

  async waitForAssets() {
    const asssetsPromises = [];

    // TODO: this is very bad and lame way to measure load time
    const { performance } = require("perf_hooks");
    const start = performance.now();

    this.assets.forEach((asset) => {
      asssetsPromises.push(
        this.page.waitForResponse(
          (resp) => resp.url().includes(asset) && resp.status() === 200
        )
      );
    });

    return await Promise.all(asssetsPromises).then(() => {
      return (performance.now() - start) / 1000;
    });
  }

  // TODO: Socket handling probably should live in its own file
  async connectToSocket(): Promise<WebSocket> {
    return new Promise((resolve) =>
      this.page.on("websocket", (ws) => {
        this.socket = ws;
        resolve(ws);
      })
    );
  }

  async waitForBetting() {
    return new Promise((resolve) =>
      this.socket
        .waitForEvent("framereceived", this.isBettingMessage)
        .then(() => resolve("betting"))
    );
  }

  async waitForRound() {
    return new Promise((resolve) =>
      this.socket
        .waitForEvent("framereceived", this.isRoundMessage)
        .then(() => resolve("round"))
    );
  }

  private isWinIncoming({ payload }) {
    let state = JSON.parse(payload);
    if (state.type === "UPDATE_STATE") {
      if (state.message.rewards.length) {
        return true;
      }
    }
    return false;
  }

  private isBetOutcoming({ payload }) {
    let state = JSON.parse(payload);
    if (state.hasOwnProperty("cashout")) {
      return true;
    }
    return false;
  }

  private isChatMessageIncoming({ payload }) {
    let state = JSON.parse(payload);
    if (state.type === "CHAT_MESSAGE") {
      return true;
    }
    return false;
  }

  private isHistoryIncoming({ payload }) {
    let state = JSON.parse(payload);
    return true;
  }

  private isChatMessageOutcoming({ payload }) {
    let state = JSON.parse(payload);
    if (state.hasOwnProperty("message")) {
      return true;
    }
    return false;
  }

  private isBettingMessage({ payload }) {
    let state = JSON.parse(payload);
    if (state.type === "ROUND_START") {
      if (state.message.status === "BETTING_TIME") {
        return true;
      }
    }
    return false;
  }

  private isRoundMessage({ payload }) {
    let state = JSON.parse(payload);
    if (state.type === "UPDATE_STATE") {
      return true;
    }
    return false;
  }
}
