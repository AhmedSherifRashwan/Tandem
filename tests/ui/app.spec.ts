import { test, expect } from '@playwright/test';
test('empty state and composer work without pretending browser has local access', async ({ page }) => {
 await page.goto('/');
 await expect(page.getByRole('heading', {name:'New conversation'})).toBeVisible();
 await page.getByRole('button',{name:'Build something'}).click();
 await expect(page.getByRole('textbox',{name:'Message Claude and Codex'})).toHaveValue(/Explore this workspace/);
 await page.getByRole('button',{name:'Deep reasoning',exact:true}).click();
 await expect(page.getByText('Independent answers → review → revision → synthesis')).toBeVisible();
 await page.getByRole('button',{name:'Send message'}).click();
 await expect(page.getByRole('alert')).toContainText('browser preview');
 await page.getByRole('button',{name:'Connections',exact:false}).first().click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await expect(page.getByText('Not detected')).toHaveCount(2);
});
for (const width of [1440,1024,390]) test(`layout ${width}`,async ({page}) => {
 await page.setViewportSize({width,height:900}); await page.goto('/');

 await expect(page.getByRole('textbox',{name:'Message Claude and Codex'})).toBeVisible();
 const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
 expect(overflow).toBe(false);
 await page.screenshot({path:`test-results/nexuslink-${width}.png`,fullPage:true});
});
