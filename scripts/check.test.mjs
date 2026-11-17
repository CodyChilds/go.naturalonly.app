/**
 * go.naturalonly.app: the files Apple and visitors read.
 *   node scripts/check.test.mjs
 * The apple-app-site-association must stay identical to the one naturalonly.app's
 * build writes (~/naturalonly.app scripts/build-site.mjs appleAppSiteAssociation).
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`  ok   ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); } }

test('CNAME is go.naturalonly.app', () => assert.equal(read('CNAME').trim(), 'go.naturalonly.app'));
test('.nojekyll is present (Jekyll would drop .well-known)', () => assert.ok(existsSync(new URL('../.nojekyll', import.meta.url))));
test('AASA: app 9QFXN8AZX2.app.naturalonly, /app and /app/ with a non-empty q only', () => {
  const a = JSON.parse(read('.well-known/apple-app-site-association'));
  assert.deepEqual(a.applinks.details.map(d => d.appIDs), [['9QFXN8AZX2.app.naturalonly']]);
  assert.deepEqual(a.applinks.details[0].components.map(c => [c['/'], c['?']]), [['/app', { q: '?*' }], ['/app/', { q: '?*' }]]);
});
test('AASA matches naturalonly.app\'s, when that repo is next to this one', () => {
  const sib = new URL('../../naturalonly.app/_site/.well-known/apple-app-site-association', import.meta.url);
  if (!existsSync(sib)) return;
  assert.deepEqual(JSON.parse(read('.well-known/apple-app-site-association')), JSON.parse(readFileSync(sib, 'utf8')));
});
test('/app sends a visitor without the app to the App Store, utm kept, no pixel', () => {
  const h = read('app/index.html');
  assert.match(h, /var store = 'https:\/\/apps\.apple\.com\/app\/naturalonly\/id6788215014';/);
  assert.match(h, /if \(\/\^utm_\/i\.test\(k\)\) utm\.append\(k, v\)/);
  assert.match(h, /location\.replace\(q \? store \+ '\?' \+ q : store\)/);
  assert.match(h, /<meta name="robots" content="noindex">/);
  assert.doesNotMatch(h, /oaiq|fbq|gtag|cookie\s*=/);
});
test('everything else goes to naturalonly.app', () => {
  for (const f of ['index.html', '404.html']) assert.match(read(f), /url=https:\/\/naturalonly\.app\//);
});
test('robots: nothing to index', () => assert.equal(read('robots.txt'), 'User-agent: *\nDisallow: /\n'));

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
