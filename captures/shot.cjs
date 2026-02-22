const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-angle=swiftshader', '--use-gl=swiftshader', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(4500);
  await page.screenshot({ path: path.join(process.cwd(), 'captures', 'title-screen-sw.png'), fullPage: true });
  await browser.close();
})();
