import { expect } from "@playwright/test";
import { test as base } from "@playwright/test";
import { Sandbox } from "./pages/sandbox";
import { LiveCrash } from "./pages/livecrash";

// Live Crash
// 1) everything whats happening (game state) coming from sockets pretty fast.
// 2) because of rapid and random changes of game state - you cannot test scenario until specific state hit (waiting for a round/betting phases), so tests should either WATCH or WAIT for game state or ENFORCE it

// There was temptation to write a custom test harness which watches game state in realtime and run some basic scenarios.
// Puppeter/selenium + OpenCV + socket.io + some report engine can do that.
// But Playwright doing the same things the box (sorry Cypress, but its much plugins for you)

// You can separate game into 2 domains for testing:
// 1) Game loop: player can bet, player can play a round (and win/loose), player can chat, player can check history, etc…  - the acutal bussiness/game scenarious we want to test
// 2) Game visuals - sync between server/player updates via sockets and madness on the screen
// Trying to do both in same quantintity can lead to very flaky results in more complex games, it kinda make sense to run regression for this items separately, trying to test their critical aspects (visuals - responsise fast and precise, loop - working, no dead states)
// The problems above can be solved also by directly controlling game state via mock server, stubs or API test handles (sockets pushes) - like game reset, specific win, etc…

// Things handled below:
// 1) Waiting for specific gamestate 2) Handling incoming/outcoming socket messages
// 3) Example of visual test 

// Things handled poorly below:
// 1) Locators 2) Elements values expectations 3) Checking actual socket message values


//TODO: not very good way of sharing data with hooks, but works for now
let sessionURL = "";

type LiveCrashFixture = {
  username: string;
};

const test = base.extend<LiveCrashFixture>({
  // NOTE: every user name is saved forever...should be way delete them after or skip validation for test games/users
  username: Math.random().toString(36).substring(2, 10),
});

test.beforeEach(async ({ browser }) => {
  // NOTE: should be get the game session link directly...
  // NOTE: should be way to reset/restart game...
  // NOTE: i am feeling bad for creating all this test sessions...even if they only exists for something like 8-12h
  console.log("beforeEach: getting game link from sandbox");
  const sandbox_page = await browser.newPage();
  const sanbox = new Sandbox(sandbox_page);
  await sanbox.goto();
  await sanbox.waitForConfig();
  await sanbox.select("game");
  const game = await sanbox.startAndSwitch();
  expect(game.url()).toContain(
    "link/to/game"
  );
  sessionURL = game.url();
  await sandbox_page.close();
});

test.describe.parallel("Smoke", () => {
  test("Place bet, send @chat message", async ({ page, username }) => {
    const livecrash = new LiveCrash(page, sessionURL);
    await livecrash.goto();
    await livecrash.connectToSocket();
    await livecrash.fillUsername(username);
    expect(livecrash.socket.url()).toContain("/socket/url");
    await livecrash.waitForLoad();
    await livecrash.waitForBetting();
    await livecrash.betMininum();
    await livecrash.waitForRound();
    await livecrash.openChat();
    await Promise.all([
      livecrash.sendChatMessage(username),
      livecrash.waitForOutcomingChatMessage(),
    ]);
    await livecrash.waitForIncomingChatMessage();
    await livecrash.checkChatMessage(username);
  });


  // NOTE: should be get way to force game state...or mock socket server
  // NOTE: my winning round record - x1800+...increased timeouts wont help in such case
  // NOTE: its also can flop with loose beyong 1.1...and i dont want to retry or wait more.
  test("Place bet, win, check @history", async ({ page, username }) => {
    const livecrash = new LiveCrash(page, sessionURL);

    await livecrash.goto();
    await livecrash.connectToSocket();
    await livecrash.fillUsername(username);
    expect(livecrash.socket.url()).toContain("/socket/url");
    await livecrash.waitForLoad();
    await livecrash.waitForBetting();
    await livecrash.betMininum();
    await livecrash.waitForRound();
    await livecrash.waitForIncomingWin();
    await livecrash.checkWinInNav();
    await livecrash.waitForBetting();
    await livecrash.openMenu();
    await livecrash.openHistory();
    await livecrash.waitForIncomingHistory();
    await livecrash.checkWinInHistory();
  });

  test("All @assets loaded in 10s", async ({ page, username }) => {
    const livecrash = new LiveCrash(page, sessionURL);
    await livecrash.goto();
    const loadTime = await livecrash.waitForAssets();
    console.log(
      `Approx assets loading time ${loadTime.toFixed(2)}s (very naive)`
    );
    expect(loadTime).toBeLessThan(10);
  });

  test.skip("@bet phase showing green status bar", async ({ page, username }) => {
    const livecrash = new LiveCrash(page, sessionURL);
    await livecrash.goto();
    await livecrash.connectToSocket();
    await livecrash.fillUsername(username);
    expect(livecrash.socket.url()).toContain("/socket/url");
    await livecrash.waitForLoad();

    // NOTE: its a flaky and bad visual test, but okay-ish example of partial capture of elements
    await livecrash.waitForBetting();
    expect(await livecrash.statusBar.screenshot()).toMatchSnapshot('betStart.png');
    await livecrash.waitForRound();
    expect(await livecrash.statusBar.screenshot()).toMatchSnapshot('betEnd.png');
  });
});
