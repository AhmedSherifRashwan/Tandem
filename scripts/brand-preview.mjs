import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const image = async (file,type) => `data:${type};base64,${(await fs.readFile(file)).toString('base64')}`;
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
 const page = await browser.newPage({viewport:{width:1200,height:480},deviceScaleFactor:1});
 const logo=await image('assets/wordmark.svg','image/svg+xml'), icon=await image('assets/icon.png','image/png'), mark=await image('assets/logo.svg','image/svg+xml');
 await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;background:#f1f4f4;font:14px Arial,sans-serif;color:#174b56}.board{height:480px;display:grid;grid-template-columns:1.2fr 1fr .65fr;align-items:center;padding:45px;gap:35px}.panel{height:350px;display:flex;flex-direction:column;justify-content:center;align-items:center;background:white;border-radius:18px}.logo{width:335px}.icon{width:270px;height:270px}.sizes{display:flex;gap:20px;align-items:center;height:220px}.caption{color:#5f6e71;font-size:12px;margin:25px 0 0}</style><div class="board"><div class="panel"><img class="logo" src="${logo}"/><p class="caption">Paired-T identity</p></div><div class="panel"><img class="icon" src="${icon}"/><p class="caption">macOS app icon</p></div><div class="panel"><div class="sizes"><img width="48" src="${mark}"/><img width="32" src="${mark}"/><img width="20" src="${mark}"/></div><p class="caption">Clear at small sizes</p></div></div>`);
 await page.locator('img').first().waitFor(); await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
 await page.screenshot({path:'docs/images/brand.png'});
} finally {await browser.close();}
