import assert from 'node:assert/strict';
import { paths, routeFor } from '../dist/js/routes.js';
import { products } from '../dist/js/products.js';
import { localeInfo, translate } from '../dist/js/i18n.js';
import {assetUrl} from '../dist/js/site.js';

const origin = process.env.CHECK_ORIGIN || 'http://127.0.0.1:4276';
const titleKeys = {
  home: 'seo.homeTitle', shop: 'shop.title', cart: 'cart.title',
  checkout: 'checkout.title', story: 'story.title', contact: 'contact.title',
  faq: 'faq.title', policies: 'policies.title', privacy: 'privacy.title', terms: 'terms.title',
};
const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const plain = value => value.replace(/\s+/g, ' ').trim();
const counts = { pages: 0, notFound: 0, assets: 0 };

async function request(pathname, status, contentType) {
  const response = await fetch(new URL(pathname, origin), {
    redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  assert.equal(response.status, status, `${pathname}: status HTTP`);
  assert.match(response.headers.get('content-type') || '', contentType, `${pathname}: Content-Type`);
  const body = new Uint8Array(await response.arrayBuffer());
  assert.ok(body.byteLength > 0, `${pathname}: resposta vazia`);
  return body;
}

async function checkPage(locale, key, product) {
  const pathname = routeFor(locale, key, product?.id || '')+'/';
  const body = await request(pathname, 200, /^text\/html(?:;|$)/i);
  const html = new TextDecoder().decode(body);
  const title = product ? `${product.name} — Floricultura`
    : `${plain(translate(locale, titleKeys[key]))}${key === 'home' ? '' : ' — Floricultura'}`;
  assert.equal(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1], escapeHtml(title), `${pathname}: título localizado`);
  assert.equal(html.match(/<html\b[^>]*\blang="([^"]+)"/i)?.[1], localeInfo[locale].lang, `${pathname}: idioma HTML`);
  counts.pages++;
}

async function main() {
  for (const locale of Object.keys(paths)) {
    for (const key of Object.keys(paths[locale])) {
      if (key === 'product') {
        for (const product of products) await checkPage(locale, key, product);
      } else await checkPage(locale, key);
    }
  }

  for (const pathname of ['/pt-br/pagina-ausente404', '/pt-br/produto/ausente404']) {
    await request(assetUrl(pathname), 404, /^text\/html(?:;|$)/i);
    counts.notFound++;
  }

  const images = new Set(['/assets/hero.webp', '/assets/atelier.webp',
    ...products.flatMap(product => [product.image, ...product.images])]);
  const assets = [
    ['/styles.css', /^text\/css(?:;|$)/i],
    ...['app', 'views', 'ui', 'routes', 'products', 'i18n', 'commerce', 'site']
      .map(name => [`/js/${name}.js`, /^(?:text|application)\/javascript(?:;|$)/i]),
    ...[...images].map(pathname => [pathname, /^image\/webp(?:;|$)/i]),
    ...['cormorant-garamond-regular', 'cormorant-garamond-italic', 'manrope']
      .map(name => [`/assets/fonts/${name}.woff2`, /^font\/woff2(?:;|$)/i]),
  ];
  await Promise.all(assets.map(async ([pathname, contentType]) => {
    await request(assetUrl(pathname), 200, contentType);
    counts.assets++;
  }));
  console.log(`HTTP OK: ${counts.pages} páginas localizadas, ${counts.notFound} rotas 404 e ${counts.assets} recursos com tipo e corpo válidos.`);
}

main().catch(error => {
  console.error(`HTTP FALHOU: ${error.message}`);
  process.exitCode = 1;
});
