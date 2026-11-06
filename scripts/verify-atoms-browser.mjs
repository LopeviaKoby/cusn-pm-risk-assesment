// Run against a local Storybook server: node scripts/verify-atoms-browser.mjs
import { chromium } from "playwright-core";
import { readdirSync } from "node:fs";

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const failures = [];
const responses = [];
const errors = [];
page.on("response", response => { if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) responses.push(`${response.status()} ${response.url()}`); });
page.on("pageerror", error => errors.push(error.message));

const index = await (await page.request.get(`${base}/index.json`)).json();
const ids = Object.keys(index.entries).filter(id => id.startsWith("atoms-catalog--") && id !== "atoms-catalog--docs");
if (ids.length !== 16) failures.push(`Expected 16 stories, got ${ids.length}`);
const selectors = {
  "button": ".button", "icon-button": ".atom-icon-button", "text-input": ".atom-input",
  "checkbox": ".atom-check", "radio-button": ".atom-radio", "switch": ".atom-switch",
  "badge": ".badge", "avatar": ".atom-avatar", "text-link": ".atom-link",
  "breadcrumb-item": ".atom-breadcrumb", "tab-item": ".atom-tab", "spinner": ".atom-spinner",
  "skeleton": ".atom-skeleton", "tooltip": ".atom-tooltip", "icon": ".atom-icon", "divider": ".atom-divider",
};

function luminance(rgb) {
  const values = rgb.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!values || values.length !== 3) return NaN;
  return values.map(value => { const x = rgb.startsWith("color(srgb") ? value : value / 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
}
function ratio(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
const results = [];
for (const theme of ["light", "dark"]) {
  for (const id of ids) {
    await page.goto(`${base}/iframe.html?id=${id}&globals=theme:${theme}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.locator("#storybook-root > *").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    const name = id.replace("atoms-catalog--", "").replace(/-atom$/, "");
    const data = await page.evaluate(selector => {
      const root = document.querySelector("#storybook-root");
      const el = root.querySelector(selector);
      const style = getComputedStyle(el);
      let parent = el;
      let bg = style.backgroundColor;
      while (parent && (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")) {
        parent = parent.parentElement;
        if (parent) bg = getComputedStyle(parent).backgroundColor;
      }
      return { theme: document.documentElement.className, color: style.color, bg, font: style.fontFamily, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
    }, selectors[name]);
    if (data.theme !== theme || !data.width || !data.height || data.overflow) failures.push(`${id}/${theme}: theme/size/reflow ${JSON.stringify(data)}`);
    const contrast = ratio(data.color, data.bg);
    if (["button", "icon-button", "badge", "text-link", "breadcrumb-item", "tab-item"].some(name => id.endsWith(`${name}-atom`)) && contrast < 4.5) failures.push(`${id}/${theme}: contrast ${contrast.toFixed(2)} ${data.color} ${data.bg}`);
    results.push({ id, theme, ...data, contrast: Number.isFinite(contrast) ? Number(contrast.toFixed(2)) : null });
  }
}

for (const width of [1440, 390]) {
  await page.setViewportSize({ width, height: 900 });
  for (const zoom of [1, 2]) {
    for (const id of ids) {
      await page.goto(`${base}/iframe.html?id=${id}&globals=theme:light`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.locator("#storybook-root > *").first().waitFor();
      const dimensions = await page.evaluate(value => {
        document.documentElement.style.zoom = String(value);
        return { viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth };
      }, zoom);
      if (dimensions.content > dimensions.viewport + 1) failures.push(`${id}: overflow at ${width}px/${zoom * 100}%: ${JSON.stringify(dimensions)}`);
    }
  }
}
for (const theme of ["light", "dark"]) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const zoom of [1, 2]) {
      await page.goto(`${base}/iframe.html?id=atoms-catalog--docs&globals=theme:${theme}`, { waitUntil: "domcontentloaded" });
      await page.getByText("Button", { exact: true }).first().waitFor();
      const dimensions = await page.evaluate(value => {
        document.documentElement.style.zoom = String(value);
        return { viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth };
      }, zoom);
      if (dimensions.content > dimensions.viewport + 1) failures.push(`autodocs/${theme}: overflow at ${width}px/${zoom * 100}%: ${JSON.stringify(dimensions)}`);
    }
  }
}

await page.goto(`${base}/iframe.html?id=atoms-catalog--button-atom&globals=theme:light`);
await page.locator("#storybook-root button").waitFor();
const font = await page.evaluate(async () => {
  await document.fonts.load('400 14px "Manrope"');
  return { loaded: document.fonts.check('400 14px "Manrope"'), family: getComputedStyle(document.querySelector("#storybook-root button")).fontFamily };
});
if (!font.loaded || !font.family.includes("Manrope")) failures.push(`Manrope: ${JSON.stringify(font)}`);
const fontAsset = readdirSync(new URL("../storybook-static/assets/", import.meta.url)).find(name => name.startsWith("Manrope-") && name.endsWith(".woff2"));
const fontResponse = await page.request.get(`${base}/assets/${fontAsset}`);
if (fontResponse.status() !== 200 || !fontResponse.headers()["content-type"]?.includes("font/woff2")) failures.push(`font response ${fontResponse.status()} ${fontResponse.headers()["content-type"]}`);
const headingFont = await page.evaluate(async () => {
  await document.fonts.load('700 32px "Google Sans"');
  return document.fonts.check('700 32px "Google Sans"');
});
const headingAsset = readdirSync(new URL("../storybook-static/assets/", import.meta.url)).find(name => name.startsWith("GoogleSans-") && name.endsWith(".woff2"));
const headingResponse = await page.request.get(`${base}/assets/${headingAsset}`);
if (!headingFont || headingResponse.status() !== 200 || !headingResponse.headers()["content-type"]?.includes("font/woff2")) failures.push(`Google Sans response ${headingResponse.status()} ${headingResponse.headers()["content-type"]}`);
const graphics = [];
for (const theme of ["light", "dark"]) {
  for (const control of ["checkbox", "radio-button", "switch"]) {
    await page.goto(`${base}/iframe.html?id=atoms-catalog--${control}-atom&globals=theme:${theme}`);
    const el = page.locator(selectors[control]);
    await el.waitFor();
    const colors = await el.evaluate(node => {
      const style = getComputedStyle(node);
      return { fg: node.classList.contains("atom-switch") ? style.backgroundColor : style.accentColor, bg: getComputedStyle(document.body).backgroundColor };
    });
    const contrast = ratio(colors.fg, colors.bg);
    graphics.push({ control, theme, ...colors, contrast: Number(contrast.toFixed(2)) });
    if (contrast < 3) failures.push(`${control}/${theme}: graphic contrast ${contrast.toFixed(2)}`);
  }
}
const variantContrasts = [];
for (const theme of ["light", "dark"]) {
  for (const [kind, variants, property, selector] of [
    ["button", ["primary", "secondary", "ghost", "destructive"], "variant", ".button"],
    ["badge", ["neutral", "info", "danger", "positive", "review"], "tone", ".badge"],
  ]) {
    for (const variant of variants) {
      await page.goto(`${base}/iframe.html?id=atoms-catalog--${kind}-atom&globals=theme:${theme}&args=${property}:${variant}`);
      const el = page.locator(`#storybook-root ${selector}`);
      await el.waitFor();
      const colors = await el.evaluate(node => {
        const style = getComputedStyle(node);
        let parent = node;
        let bg = style.backgroundColor;
        while (parent && (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")) {
          parent = parent.parentElement;
          if (parent) bg = getComputedStyle(parent).backgroundColor;
        }
        return { fg: style.color, bg };
      });
      const contrast = ratio(colors.fg, colors.bg);
      variantContrasts.push({ kind, variant, theme, contrast: Number(contrast.toFixed(2)) });
      if (contrast < 4.5) failures.push(`${kind}/${variant}/${theme}: text contrast ${contrast.toFixed(2)}`);
    }
  }
}
await page.emulateMedia({ reducedMotion: "reduce" });
const reducedMotion = {};
for (const control of ["spinner", "skeleton"]) {
  await page.goto(`${base}/iframe.html?id=atoms-catalog--${control}-atom&globals=theme:light`);
  const el = page.locator(selectors[control]);
  await el.waitFor();
  reducedMotion[control] = await el.evaluate(node => getComputedStyle(node).animationName);
  if (reducedMotion[control] !== "none") failures.push(`${control}: animation remains under reduced motion`);
}
await page.emulateMedia({ reducedMotion: "no-preference" });
await page.goto(`${base}/iframe.html?id=atoms-catalog--button-atom&globals=theme:light`);
const button = page.locator("#storybook-root .button");
await button.waitFor();
const buttonNormal = await button.evaluate(node => getComputedStyle(node).backgroundColor);
await button.hover();
await page.waitForTimeout(250);
const buttonHover = await button.evaluate(node => getComputedStyle(node).backgroundColor);
if (buttonNormal === buttonHover) failures.push("Button hover color unchanged");
await browser.close();
console.log(JSON.stringify({ stories: ids.length, themes: 2, viewportChecks: ids.length * 4, docsViewportChecks: 8, font, fontResponse: { status: fontResponse.status(), mime: fontResponse.headers()["content-type"] }, headingFont, headingResponse: { status: headingResponse.status(), mime: headingResponse.headers()["content-type"] }, graphics, variantContrasts, reducedMotion, buttonNormal, buttonHover, results, responses, errors, failures }, null, 2));
if (responses.length || errors.length || failures.length) process.exitCode = 1;
