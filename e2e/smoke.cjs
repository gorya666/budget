// Smoke scenario against a running server using the in-memory backend (no SUPABASE_* env).
// Usage: npm run build && npx next start -p 3100 & node e2e/smoke.cjs /tmp/shots
const { chromium } = require('playwright');
const out = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto((process.env.BASE_URL || 'http://localhost:3100') + '/2026-11');
  await page.waitForSelector('[data-testid=column-ostap]');
  await page.screenshot({ path: `${out}/01-empty.png`, fullPage: true });

  // 1) One-click close: Ostap's cushion
  await page.getByRole('button', { name: /Закрити Подушка/ }).first().click();
  await page.waitForTimeout(800);

  // 2) Installment via dialog: Lena, groceries, 15k on the 7th
  await page.getByRole('button', { name: 'Внесок', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Лєна/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Продукти' }).click();
  await page.getByRole('dialog').getByLabel('Сума, ₴').fill('15к');
  await page.getByRole('dialog').getByLabel('Дата').fill('2026-11-07');
  await page.getByRole('dialog').getByRole('button', { name: /Додати 15 000/ }).click();
  await page.waitForTimeout(800);

  // 3) Ostap apartment in two installments
  for (const [amt, date] of [['25000', '2026-11-07'], ['12000', '2026-11-22']]) {
    await page.getByRole('button', { name: 'Внесок', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Квартира' }).click();
    await page.getByRole('dialog').getByLabel('Сума, ₴').fill(amt);
    await page.getByRole('dialog').getByLabel('Дата').fill(date);
    await page.getByRole('dialog').getByRole('button', { name: /Додати/ }).click();
    await page.waitForTimeout(700);
  }
  // 4) Rent closed
  await page.getByRole('button', { name: /Закрити Оренда/ }).click();
  await page.waitForTimeout(700);
  // 5) Task
  await page.getByLabel('Нова задача').fill('Купити ОВДП на $1 730');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);

  await page.screenshot({ path: `${out}/02-filled.png`, fullPage: true });
  await page.getByRole('button', { name: 'Внесок', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Пенсія' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/03-dialog.png` });
  await page.keyboard.press('Escape');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.goto((process.env.BASE_URL || 'http://localhost:3100') + '/2026-11');
  await mobile.waitForSelector('[data-testid=column-ostap]');
  await mobile.screenshot({ path: `${out}/04-mobile.png`, fullPage: true });

  const hero = await page.locator('text=Закрито за листопад').locator('..').innerText();
  console.log('HERO:', hero.replace(/\s+/g, ' '));
  console.log('ERRORS:', JSON.stringify(errors));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
