import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { paths, routeFor, parseRoute } from '../dist/js/routes.js';
import { messages, localeInfo, translate } from '../dist/js/i18n.js';
import { products, market } from '../dist/js/products.js';
import {basePath,siteOrigin} from '../dist/js/site.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const locales = ['pt-br', 'en', 'es'];
const P = pathname => basePath+pathname;

test('localized routes resolve to the intended public page', () => {
  const cases = [
    ['pt-br', 'shop', '/pt-br/colecao'],
    ['en', 'story', '/en/our-story'],
    ['es', 'contact', '/es/contacto'],
    ['es', 'product', '/es/producto/belle-rose', 'belle-rose'],
  ];
  for (const [locale, key, localPath, id = ''] of cases) {
    const pathname=P(localPath);
    assert.equal(routeFor(locale, key, id), pathname);
    assert.deepEqual(parseRoute(pathname), { locale, key, id });
  }
  assert.deepEqual(parseRoute(P('/')), { locale: 'pt-br', key: 'home', id: '' });
  assert.deepEqual(parseRoute(P('/en/')), { locale: 'en', key: 'home', id: '' });
});

test('product identifiers survive URL encoding without becoming extra path segments', () => {
  assert.equal(routeFor('en', 'product', 'rosa & flor/extra'), P('/en/product/rosa%20%26%20flor%2Fextra'));
  assert.deepEqual(parseRoute(P('/en/product/rosa%20%26%20flor%2Fextra')), {
    locale: 'en', key: 'product', id: 'rosa & flor/extra',
  });
});

test('unsupported locales and malformed routes fall back safely', () => {
  assert.equal(routeFor('fr', 'shop'), P('/pt-br/colecao'));
  assert.equal(routeFor('en', 'missing'), P('/en/404'));
  assert.equal(routeFor('en', 'toString'), P('/en/404'));
  for (const pathname of ['/fr/collection', '/en/no-such-page', '/en/product', '/en/collection/extra', '/en/product/%E0%A4%A']) {
    assert.equal(parseRoute(P(pathname)).key, 'notFound', pathname);
  }
  assert.equal(parseRoute(P('/fr/collection')).locale, 'pt-br');
});

test('translation resolves requested language, fallback and named interpolation', () => {
  assert.equal(translate('en', 'nav.shop'), 'Collection');
  assert.equal(translate('es', 'product.gallery', { name: 'Aurora' }), 'Galería de Aurora');
  assert.equal(translate('fr', 'nav.shop'), 'Coleção');
  assert.equal(translate('en', 'unknown.key'), 'unknown.key');
  assert.equal(translate('pt-br', 'shop.results', { count: 0 }), '0 composições');
  assert.equal(translate('en', 'product.gallery'), '{name} gallery');
});

test('every language provides complete matching keys and interpolation variables', () => {
  const reference = Object.keys(messages['pt-br']).sort();
  const variables = text => [...text.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map(match => match[1]).sort();
  assert.deepEqual(Object.keys(messages).sort(), [...locales].sort());
  for (const locale of locales) {
    assert.deepEqual(Object.keys(messages[locale]).sort(), reference, locale);
    assert.ok(localeInfo[locale].lang);
    for (const key of reference) {
      assert.equal(typeof messages[locale][key], 'string', `${locale}: ${key}`);
      assert.ok(messages[locale][key].trim(), `${locale}: ${key}`);
      assert.deepEqual(variables(messages[locale][key]), variables(messages['pt-br'][key]), `${locale}: ${key}`);
    }
  }
});

test('catalog items have usable unique routes, local images and localized descriptions', () => {
  assert.ok(products.length > 0);
  assert.equal(new Set(products.map(product => product.id)).size, products.length);
  for (const product of products) {
    assert.match(product.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(product.name.trim());
    assert.ok(Number.isInteger(product.price) && product.price > 0);
    assert.ok(['bouquets', 'arrangements', 'gifts'].includes(product.category));
    assert.ok(['pink', 'white', 'burgundy', 'yellow', 'mixed'].includes(product.color));
    assert.ok(product.occasions.length > 0);
    assert.ok(product.occasions.every(occasion => ['birthday', 'love', 'home', 'thanks', 'wedding'].includes(occasion)));
    assert.match(product.image, /^\/assets\/[a-z0-9-]+\.webp$/);
    assert.ok(product.images.includes(product.image));
    for (const locale of locales) {
      assert.ok(product.description[locale]?.trim());
      assert.ok(product.composition[locale]?.trim());
      assert.deepEqual(parseRoute(routeFor(locale, 'product', product.id)), { locale, key: 'product', id: product.id });
    }
  }
  assert.equal(market.currency, 'BRL');
  assert.equal(market.country, 'BR');
  assert.ok(Number.isInteger(market.shipping) && market.shipping >= 0);
  assert.ok(Number.isInteger(market.freeShippingAt) && market.freeShippingAt > 0);
});

test('static build emits localized SEO, corresponding alternates and a safe demo shell', async () => {
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout || 'Build did not complete');
  const read = pathname => readFile(new URL(`../dist/${pathname}`, import.meta.url), 'utf8');
  const en = await read('en/collection/index.html');
  assert.match(en, /<html lang="en">/);
  assert.match(en, /<title>The collection[^<]*Floricultura<\/title>/);
  assert.match(en, /<meta name="description" content="Explore the Floricultura collection/);
  assert.ok(en.includes(`rel="canonical" href="${siteOrigin}${P('/en/collection')}"`));
  assert.match(en, /hreflang="pt-BR" href="[^\"]+\/pt-br\/colecao"/);
  assert.match(en, /hreflang="es" href="[^\"]+\/es\/coleccion"/);
  assert.match(en, /hreflang="x-default" href="[^\"]+\/pt-br\/colecao"/);
  assert.match(en, /name="robots" content="noindex, nofollow"/);
  assert.ok(en.includes(`<script type="module" src="${P('/js/app.js')}"></script>`));
  assert.match(en, /<noscript>/);
  const spanish = await read('es/index.html');
  assert.match(spanish, /aria-label="Cargando…"/);
  assert.match(spanish, /<html lang="es">/);
  for (const locale of locales) {
    const product = await read(`${locale}/${paths[locale].product}/belle-rose/index.html`);
    const schemas = [...product.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
    const item = schemas.find(schema => schema['@type'] === 'Product');
    assert.equal(item?.name, 'Belle Rose');
    assert.equal(item?.description, products.find(entry => entry.id === 'belle-rose').description[locale]);
    assert.equal(Object.hasOwn(item, 'offers'), false);
    assert.match(product, /script-src 'self' 'sha256-/);
  }
  const sitemap = await read('sitemap.xml');
  assert.match(sitemap, /\/es\/coleccion<\/loc>/);
  assert.doesNotMatch(sitemap, /\/(bag|bolsa|carrinho|checkout|404)(?:<|\/)/);
  assert.ok((await read('robots.txt')).includes(`Disallow: ${basePath}/`));
  assert.match(await read('404.html'), /<meta name="robots" content="noindex, nofollow">/);
});
