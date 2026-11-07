// End-to-end test of the real app in Chromium, driven by the built-in demo glove.
//   npm run build && npm start &   then   npm run e2e   (E2E_URL defaults to http://localhost:3000)
// Covers: demo glove → calibrate → teach signs → translate → reject unknown →
// emergency alarm → hands-free board navigation, with zero console errors.
// CommonJS on purpose: resolves a globally installed Playwright as well as a local one.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright');

const URL = process.env.E2E_URL || 'http://localhost:3000';
const failures = [];
const check = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) failures.push(msg); };

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ ...devices['Pixel 7'] })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const btn = (name) => page.getByRole('button', { name });
  const perform = async (shape, wait = 2100) => { await btn(`Perform ${shape}`).click(); await page.waitForTimeout(wait); };
  const lastStatus = () => page.locator('[role=status]').first().innerText().catch(() => '');

  await page.goto(URL);
  await btn('✨ Use demo glove').click();
  check(await page.getByText('Demo glove').first().isVisible(), 'demo glove connects');

  await btn('Go to Signs').click();
  await btn('① Calibrate glove').click();
  await btn('Start').click();
  await btn('Save').waitFor({ timeout: 15000 });
  check(await page.getByText('All five fingers move well.').isVisible(), 'calibration detects all five fingers');
  await btn('Save').click();

  const teach = async (choose, shape, custom) => {
    await btn('＋ Teach a sign').click();
    if (custom) {
      await page.getByRole('combobox').selectOption(custom);
      await page.getByRole('button', { name: 'Next: record it' }).click();
    } else {
      await btn(new RegExp(`^${choose}`)).first().click();
    }
    for (let i = 0; i < 4; i++) await perform(shape);
    const label = await page.locator('[aria-label$="recorded"]').getAttribute('aria-label');
    check(label === '4 of 4 recorded', `teach ${choose}: ${label}`);
    await btn('Save').click();
  };
  await teach('Yes', 'Thumb up');
  await teach('No', 'Thumb down');
  await teach('Help', 'Fist');
  await teach('water', 'Point');
  await teach('next', 'Wave', 'next');

  await btn('Translate').click();
  await perform('Thumb up');
  check((await lastStatus()).includes('Yes'), 'thumb up → "Yes"');
  await perform('Thumb down');
  check((await lastStatus()).includes('No'), 'thumb down → "No"');
  await perform('Point');
  check((await page.locator('section[aria-label=Translation] p').first().innerText()) === 'Water', 'point → "water" added to sentence');
  await perform('I-L-Y');
  check((await lastStatus()).includes('not recognised'), 'untaught sign is rejected, not guessed');

  await perform('Fist');
  check(await page.getByRole('alertdialog').isVisible(), 'help sign raises the full-screen alarm');
  await page.getByText('I’m here').click();
  check((await page.getByRole('alertdialog').count()) === 0, 'carer can stop the alarm');

  const history = JSON.parse(await page.evaluate(() => localStorage.getItem('gt.history') || '[]'));
  check(history.map((h) => h.text).join('|').includes('Yes'), 'spoken messages are kept in history');

  await btn('Board').click();
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await perform('Wave');
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-scan'));
  check(focused, '"next" sign moves the highlight on the touch board');

  check(errors.length === 0, `no console errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
  if (failures.length) {
    console.error(`\n${failures.length} check(s) failed`);
    process.exit(1);
  }
  console.log('\nAll end-to-end checks passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
