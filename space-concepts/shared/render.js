// node render.js <dir> [t]  -> <dir>/hero.jpg 1920x1080 (headless swiftshader, like reel/render*.js)
const { chromium } = require('playwright');
(async () => {
  const [dir, t = '8'] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message)); p.on('console', m => m.type() === 'error' && console.log('CONSOLE', m.text()));
  await p.goto('file://' + dir + '/index.html?t=' + t);
  await p.waitForFunction('window.__ready', null, { timeout: 600000 });
  await p.waitForTimeout(300);
  await p.screenshot({ path: dir + '/hero.jpg', type: 'jpeg', quality: 92 });
  await b.close(); console.log('ok', dir);
})();
