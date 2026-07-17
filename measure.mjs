import { chromium } from 'playwright-core';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1300 } });
await page.goto('http://localhost:5174/', { waitUntil: 'load' });
await page.waitForTimeout(4500);
const info = await page.evaluate(() => {
  const container = document.querySelector('#banners > div');
  const img = document.querySelector('img[alt*="Sharpness"]');
  const banner = img.closest('[class*="banner"]');
  const rect = banner.getBoundingClientRect();
  const cs = getComputedStyle(banner);
  const containerRect = container.getBoundingClientRect();
  const sectionEl = document.querySelector('#banners');
  const containerDiv = sectionEl.querySelector(':scope > div');
  const ccs = getComputedStyle(containerDiv);
  return {
    containerWidth: containerRect.width,
    containerPadding: ccs.paddingLeft + ' / ' + ccs.paddingRight,
    containerMaxWidth: ccs.maxWidth,
    bannerWidth: rect.width,
    bannerHeight: rect.height,
    borderRadius: cs.borderRadius,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
