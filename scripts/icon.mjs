// Export the editable flat SVG variant. The generated macOS icon.png is preserved.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const browser = await chromium.launch({channel:'chrome',headless:true});
try {const page=await browser.newPage({viewport:{width:1024,height:1024},deviceScaleFactor:1}); await page.setContent(`<style>body{margin:0;background:transparent}</style>${await fs.readFile('assets/icon.svg','utf8')}`); await page.screenshot({path:'assets/icon-flat.png',omitBackground:true});} finally {await browser.close();}
