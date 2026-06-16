const fs = require("fs");
const path = require("path");
const pw = require("C:/Users/techadmin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core");

const target = process.argv[2] || "http://127.0.0.1:8000/index.html";
const label = process.argv[3] || "qa";

const rect = (el) => {
  if (!el) return null;
  const box = el.getBoundingClientRect();
  return Object.fromEntries(
    ["x", "y", "width", "height", "top", "bottom", "left", "right"].map((key) => [
      key,
      Math.round(box[key]),
    ])
  );
};

(async () => {
  const qaDir = path.join(process.env.TEMP || process.cwd(), "pca-visual-qa");
  fs.mkdirSync(qaDir, { recursive: true });

  const browser = await pw.chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });

  const logs = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      logs.push({ type: message.type(), text: message.text() });
    }
  });

  await page.goto(target, { waitUntil: "networkidle", timeout: 15000 });
  const desktopPath = path.join(qaDir, `${label}-desktop.png`);
  await page.screenshot({ path: desktopPath, fullPage: false });

  await page.evaluate(() => {
    document.querySelector("#mission")?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(250);
  const missionPath = path.join(qaDir, `${label}-mission.png`);
  await page.screenshot({ path: missionPath, fullPage: false });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(250);
  const footerPath = path.join(qaDir, `${label}-footer.png`);
  await page.screenshot({ path: footerPath, fullPage: false });

  const pageData = await page.evaluate((capturedLogs) => {
    const rect = (el) => {
      if (!el) return null;
      const box = el.getBoundingClientRect();
      return Object.fromEntries(
        ["x", "y", "width", "height", "top", "bottom", "left", "right"].map((key) => [
          key,
          Math.round(box[key]),
        ])
      );
    };

    return {
      title: document.title,
      url: location.href,
      scrollWidth: document.body.scrollWidth,
      innerWidth,
      missionDateRect: rect(document.querySelector("#mission .date")),
      footerRect: rect(document.querySelector("#footer")),
      headerLogoRect: rect(document.querySelector("#header .logo")),
      footerText: document.querySelector("#footer")?.innerText?.().slice(0, 500),
      logs: capturedLogs,
    };
  }, logs);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(target, { waitUntil: "networkidle", timeout: 15000 });
  const mobilePath = path.join(qaDir, `${label}-mobile.png`);
  await page.screenshot({ path: mobilePath, fullPage: false });

  const mobileData = await page.evaluate(() => ({
    scrollWidth: document.body.scrollWidth,
    innerWidth,
    headerLogoText: document.querySelector("#header .logo")?.textContent?.trim(),
    introText: document.querySelector("#intro p")?.textContent?.trim(),
  }));

  await browser.close();

  console.log(
    JSON.stringify(
      {
        qaDir,
        screenshots: { desktopPath, missionPath, footerPath, mobilePath },
        pageData,
        mobileData,
      },
      null,
      2
    )
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
