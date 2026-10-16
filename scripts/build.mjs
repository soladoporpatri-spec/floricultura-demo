import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { paths, routeFor } from '../dist/js/routes.js';
import { localeInfo, translate } from '../dist/js/i18n.js';
import { products } from '../dist/js/products.js';
import {siteOrigin as origin,siteUrl,assetUrl,stripBase,basePath} from '../dist/js/site.js';

const output = new URL('../dist/', import.meta.url);
const locales = Object.keys(localeInfo);
const publicPages = new Set(['home', 'shop', 'product', 'story', 'contact', 'faq', 'policies', 'privacy', 'terms']);
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const plain = value => String(value).replace(/\s+/g, ' ').trim();
const json = value => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
const noscript = {
  'pt-br': 'Ative o JavaScript no seu navegador para explorar a coleção e experimentar a sacola.',
  en: 'Enable JavaScript in your browser to explore the collection and try the shopping bag.',
  es: 'Activa JavaScript en tu navegador para explorar la colección y probar la bolsa.',
};
const metadataKeys = {
  home: ['seo.homeTitle', 'seo.homeDescription'],
  shop: ['shop.title', 'seo.shopDescription'],
  cart: ['cart.title', 'common.demoShort'],
  checkout: ['checkout.title', 'checkout.description'],
  story: ['story.title', 'story.intro'],
  contact: ['contact.title', 'contact.description'],
  faq: ['faq.title', 'seo.defaultDescription'],
  policies: ['policies.title', 'policies.intro'],
  privacy: ['privacy.title', 'privacy.intro'],
  terms: ['terms.title', 'terms.intro'],
  notFound: ['notFound.title', 'notFound.description'],
};

function pagePath(locale, key, id = '') {
  return key === 'notFound' ? `${basePath}/${locale}/404` : routeFor(locale, key, id);
}

function renderPage(locale, key, product) {
  const id = product?.id || '';
  const pathname = pagePath(locale, key, id);
  const canonical = `${origin}${pathname}`;
  const title = product
    ? `${product.name} — Floricultura`
    : `${plain(translate(locale, metadataKeys[key][0]))}${key === 'home' ? '' : ' — Floricultura'}`;
  const description = plain(product ? product.description[locale] : translate(locale, metadataKeys[key][1]));
  const image = `${origin}${assetUrl(product?.image || '/assets/hero.webp')}`;
  const alternates = [...locales.map(other => ({
    lang: localeInfo[other].lang,
    href: `${origin}${pagePath(other, key, id)}`,
  })), { lang: 'x-default', href: `${origin}${pagePath('pt-br', key, id)}` }];
  const schemas = [{
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Floricultura',
    url: siteUrl,
    logo: `${origin}${assetUrl('/assets/favicon.svg')}`,
  }];
  if (product) schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description[locale],
    image: product.images.map(path => `${origin}${assetUrl(path)}`),
    sku: product.id,
    url: canonical,
  });
  const serialized = schemas.map(json);
  const hashes = serialized.map(value => `'sha256-${createHash('sha256').update(value).digest('base64')}'`).join(' ');
  const csp = `default-src 'self'; script-src 'self' ${hashes}; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
  return `<!doctype html>
<html lang="${escape(localeInfo[locale].lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${escape(csp)}">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#76102c">
  <meta name="site-origin" content="${origin}">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <link rel="canonical" href="${escape(canonical)}">
${alternates.map(link => `  <link rel="alternate" hreflang="${escape(link.lang)}" href="${escape(link.href)}">`).join('\n')}
  <meta property="og:type" content="${product ? 'product' : 'website'}">
  <meta property="og:site_name" content="Floricultura">
  <meta property="og:locale" content="${escape(localeInfo[locale].locale.replace('-', '_'))}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:url" content="${escape(canonical)}">
  <meta property="og:image" content="${escape(image)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <meta name="twitter:image" content="${escape(image)}">
  <link rel="icon" type="image/svg+xml" href="${assetUrl('/assets/favicon.svg')}">
  <link rel="stylesheet" href="${assetUrl('/styles.css')}">
${serialized.map(value => `  <script type="application/ld+json">${value}</script>`).join('\n')}
  <script type="module" src="${assetUrl('/js/app.js')}"></script>
</head>
<body>
  <div id="app"><div class="initial-loading" role="status" aria-label="${escape(translate(locale, 'common.loading'))}"><span class="initial-mark" aria-hidden="true">F</span><span>${escape(translate(locale, 'common.loading'))}</span></div></div>
  <noscript><p>${escape(noscript[locale])}</p><p>${escape(translate(locale, 'common.demoShort'))}</p></noscript>
</body>
</html>
`;
}

async function write(relative, contents) {
  const destination = new URL(relative, output);
  await mkdir(new URL('./', destination), { recursive: true });
  await writeFile(destination, contents, 'utf8');
}

const generated = [];
for (const locale of locales) {
  for (const key of Object.keys(paths[locale])) {
    if (key === 'product') {
      for (const product of products) {
        const pathname = pagePath(locale, key, product.id);
        await write(`${stripBase(pathname).slice(1)}/index.html`, renderPage(locale, key, product));
        generated.push({ locale, key, id: product.id, pathname });
      }
    } else {
      const pathname = pagePath(locale, key);
      await write(`${stripBase(pathname).slice(1)}/index.html`, renderPage(locale, key));
      generated.push({ locale, key, id: '', pathname });
    }
  }
  await write(`${locale}/404/index.html`, renderPage(locale, 'notFound'));
}
await write('index.html', renderPage('pt-br', 'home'));
await write('404.html', renderPage('pt-br', 'notFound'));

const entries = generated.filter(page => publicPages.has(page.key));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(page => `  <url>
    <loc>${escape(`${origin}${page.pathname}`)}</loc>
${[...locales.map(locale => ({ lang: localeInfo[locale].lang, path: pagePath(locale, page.key, page.id) })), { lang: 'x-default', path: pagePath('pt-br', page.key, page.id) }].map(link => `    <xhtml:link rel="alternate" hreflang="${escape(link.lang)}" href="${escape(`${origin}${link.path}`)}"/>`).join('\n')}
  </url>`).join('\n')}
</urlset>
`;
await write('sitemap.xml', sitemap);
await write('robots.txt', `User-agent: *\nDisallow: ${basePath}/\n\nSitemap: ${siteUrl}sitemap.xml\n`);
await write('.nojekyll', '');
await write('_headers', `# Static hosting hint. Hosts may ignore this file; verify response headers after deployment.\n# Content-Security-Policy is set in each HTML document with JSON-LD hashes.\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n  X-Robots-Tag: noindex, nofollow\n`);
console.log(`Built ${generated.length + locales.length + 2} HTML pages and ${entries.length} sitemap entries in ${fileURLToPath(output)}.`);
