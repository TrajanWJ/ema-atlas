
const { chromium } = require('playwright');
(async() => {
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: '/tmp/t3code-home.png', fullPage: true });
  await browser.close();
})();
