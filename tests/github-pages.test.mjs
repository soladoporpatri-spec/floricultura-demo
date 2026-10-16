import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assetUrl, basePath, stripBase, siteOrigin } from '../dist/js/site.js';
import { routeFor, parseRoute } from '../dist/js/routes.js';

test('project hosting keeps routes and assets inside its own base path', () => {
  assert.equal(basePath, '/floricultura-demo');
  assert.equal(assetUrl('/assets/hero.webp'), '/floricultura-demo/assets/hero.webp');
  assert.equal(stripBase('/floricultura-demo/pt-br/colecao'), '/pt-br/colecao');
  assert.equal(stripBase('/floricultura-demo-extra/pt-br'), null);
  assert.equal(routeFor('en', 'shop'), '/floricultura-demo/en/collection');
  assert.deepEqual(parseRoute('/floricultura-demo/es/producto/belle-rose/'), {locale:'es',key:'product',id:'belle-rose'});
  assert.equal(parseRoute('/pt-br/colecao').key, 'notFound');
});

test('GitHub Pages output has independent assets, social links and attribution', async () => {
  const html = await readFile(new URL('../dist/pt-br/index.html', import.meta.url), 'utf8');
  assert.ok(html.includes(`href="${siteOrigin}${basePath}/pt-br"`));
  assert.ok(html.includes(`src="${basePath}/js/app.js"`));
  assert.ok(html.includes(`href="${basePath}/styles.css"`));
  assert.doesNotMatch(html, /chatgpt|openai/i);
  const app = await readFile(new URL('../dist/js/app.js', import.meta.url), 'utf8');
  assert.ok(app.includes('https://github.com/soladoporpatri-spec'));
  assert.ok(app.includes("t('footer.credit')"));
  const css = await readFile(new URL('../dist/styles.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /url\(['"]?\/assets/);
});
