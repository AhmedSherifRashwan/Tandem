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
 await page.screenshot({path:`test-results/tandem-${width}.png`,fullPage:true});
});

test('preview drag, keyboard resize, reset and saved width', async ({page}) => {
 await page.setViewportSize({width:1440,height:900}); await page.goto('/');
 const handle = page.getByRole('separator',{name:'Resize preview pane'});
 const pane = page.locator('#workspace-panel');
 const initial = (await pane.boundingBox())!.width;
 const box = (await handle.boundingBox())!;
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await page.mouse.down(); await page.mouse.move(box.x-150,box.y+box.height/2,{steps:8}); await page.mouse.up();
 const expanded = (await pane.boundingBox())!.width;
 expect(expanded).toBeGreaterThan(initial+140);
 await page.reload(); await expect(handle).toHaveAttribute('aria-valuenow',String(Math.round(expanded)));
 await handle.focus(); await page.keyboard.press('ArrowRight');
 await expect(handle).toHaveAttribute('aria-valuenow',String(Math.round(expanded)-16));
 await page.keyboard.press('End');
 expect((await page.locator('.conversation').boundingBox())!.width).toBeGreaterThanOrEqual(419);
 await handle.dblclick(); await expect(handle).toHaveAttribute('aria-valuenow','400');
 await page.getByRole('button',{name:'Report',exact:true}).click();
 await expect(handle).toBeVisible();
 await page.getByRole('button',{name:'Toggle workspace panel'}).click(); await expect(handle).toHaveCount(0);
 await page.getByRole('button',{name:'Toggle workspace panel'}).click(); await expect(handle).toHaveAttribute('aria-valuenow','400');
});

test('preview adapts when the window narrows without discarding preferred width',async({page})=>{
 await page.setViewportSize({width:1440,height:900}); await page.goto('/');
 const handle=page.getByRole('separator',{name:'Resize preview pane'});
 await handle.focus(); await page.keyboard.press('End');
 const preferred=await handle.getAttribute('aria-valuenow');
 await page.setViewportSize({width:1024,height:768});
 expect((await page.locator('.conversation').boundingBox())!.width).toBeGreaterThanOrEqual(419);
 await page.setViewportSize({width:390,height:844}); await expect(handle).toBeHidden();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 await page.setViewportSize({width:1440,height:900}); await expect(handle).toHaveAttribute('aria-valuenow',preferred!);
});
