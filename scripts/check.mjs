import { access, readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { paths, routeFor, parseRoute } from '../dist/js/routes.js';
import { messages, localeInfo } from '../dist/js/i18n.js';
import { products, market } from '../dist/js/products.js';
import {siteOrigin as origin,basePath,stripBase,assetUrl} from '../dist/js/site.js';

// This is a syntax and project-consistency checker, not ESLint.
// Hosting support for dist/_headers must be verified in the deployed responses.
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const failures = [];
const locales = Object.keys(localeInfo);
const requireThat = (condition, message) => { if (!condition) failures.push(message); };
const exists = async file => { try { await access(file); return true; } catch { return false; } };

async function filesUnder(directory) {
  if (!await exists(directory)) return [];
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory() && !entry.isSymbolicLink()) result.push(...await filesUnder(full));
    else if (entry.isFile()) result.push(full);
  }
  return result;
}

const files = [
  ...await filesUnder(path.join(dist, 'js')),
  ...await filesUnder(path.join(root, 'scripts')),
  ...await filesUnder(path.join(root, 'tests')),
];
const modules = files.filter(file => /\.(?:mjs|js)$/.test(file));
for (const file of modules) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  requireThat(result.status === 0, `${path.relative(root, file)}: syntax error\n${result.stderr || result.stdout}`);
}

const reference = Object.keys(messages['pt-br']).sort();
const variables = text => [...text.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map(match => match[1]).sort().join(',');
for (const locale of locales) {
  requireThat(Object.keys(messages[locale] || {}).sort().join('|') === reference.join('|'), `${locale}: translation keys do not match Portuguese.`);
  for (const key of reference) {
    const text = messages[locale]?.[key];
    requireThat(typeof text === 'string' && text.trim().length > 0, `${locale}: empty translation ${key}.`);
    if (typeof text === 'string') requireThat(variables(text) === variables(messages['pt-br'][key]), `${locale}: interpolation variables differ for ${key}.`);
  }
}

for (const file of modules.filter(file => path.dirname(file) === path.join(dist, 'js'))) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/\bc\.t\(\s*(['"])([^'"\r\n]+)\1/g)) {
    requireThat(Object.hasOwn(messages['pt-br'], match[2]), `${path.relative(root, file)}: unknown translation key ${match[2]}.`);
  }
  for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*)['"](\.[^'"]+)['"]/g)) {
    requireThat(await exists(path.resolve(path.dirname(file), match[1])), `${path.relative(root, file)}: missing import ${match[1]}.`);
  }
}

requireThat(new Set(products.map(product => product.id)).size === products.length, 'Catalog product IDs must be unique.');
requireThat(products.length > 0, 'Catalog must contain products.');
requireThat(market.currency === 'BRL' && market.country === 'BR', 'Demo catalog must use the Brazilian market.');
for (const product of products) {
  requireThat(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.id), `${product.id}: unsafe product route identifier.`);
  requireThat(Number.isInteger(product.price) && product.price > 0, `${product.id}: price must be positive integer centavos.`);
  requireThat(['bouquets', 'arrangements', 'gifts'].includes(product.category), `${product.id}: unknown category.`);
  requireThat(['pink', 'white', 'burgundy', 'yellow', 'mixed'].includes(product.color), `${product.id}: unknown color.`);
  requireThat(product.images?.includes(product.image), `${product.id}: primary image missing from gallery.`);
  for (const locale of locales) {
    requireThat(Boolean(product.description[locale]?.trim() && product.composition[locale]?.trim()), `${product.id}: missing ${locale} product content.`);
    const parsed = parseRoute(routeFor(locale, 'product', product.id));
    requireThat(parsed.key === 'product' && parsed.id === product.id && parsed.locale === locale, `${product.id}: product route does not round-trip for ${locale}.`);
  }
}

const requiredPages = new Set(['index.html', '404.html']);
for (const locale of locales) {
  for (const key of Object.keys(paths[locale])) {
    if (key === 'product') for (const product of products) requiredPages.add(`${stripBase(routeFor(locale, key, product.id)).slice(1)}/index.html`);
    else requiredPages.add(`${stripBase(routeFor(locale, key)).slice(1)}/index.html`);
  }
  requiredPages.add(`${locale}/404/index.html`);
}

for (const relative of requiredPages) {
  const file = path.join(dist, relative);
  if (!await exists(file)) {
    failures.push(`Missing generated page ${relative}. Run the build first.`);
    continue;
  }
  const html = await readFile(file, 'utf8');
  const pathname = relative === 'index.html' ? `${basePath}/` : relative === '404.html' ? `${basePath}/404.html` : `${basePath}/${relative.replace(/\/index\.html$/, '')}`;
  const parsed = parseRoute(pathname);
  const { locale, key, id } = parsed;
  const canonicalPath = key === 'notFound' ? `${basePath}/${locale}/404` : routeFor(locale, key, id);
  requireThat(html.includes(`<html lang="${localeInfo[locale].lang}">`), `${relative}: wrong html language.`);
  requireThat(/<meta charset="utf-8">/.test(html), `${relative}: missing charset.`);
  requireThat(/name="viewport" content="width=device-width, initial-scale=1"/.test(html), `${relative}: missing responsive viewport.`);
  requireThat(/<title>[^<]+<\/title>/.test(html), `${relative}: empty title.`);
  requireThat(/<meta name="description" content="[^"]+">/.test(html), `${relative}: empty description.`);
  requireThat(html.includes(`<link rel="canonical" href="${origin}${canonicalPath}">`), `${relative}: canonical does not match the route.`);
  for (const alternate of [...locales, 'x-default']) {
    const targetLocale = alternate === 'x-default' ? 'pt-br' : alternate;
    const href = key === 'notFound' ? `${basePath}/${targetLocale}/404` : routeFor(targetLocale, key, id);
    const lang = alternate === 'x-default' ? alternate : localeInfo[alternate].lang;
    requireThat(html.includes(`<link rel="alternate" hreflang="${lang}" href="${origin}${href}">`), `${relative}: missing corresponding ${lang} alternate.`);
  }
  requireThat(html.includes('<meta name="robots" content="noindex, nofollow">'), `${relative}: demo must remain noindex.`);
  requireThat(html.includes('<div id="app">'), `${relative}: app mount is missing.`);
  requireThat(html.includes(`aria-label="${messages[locale]['common.loading']}">`), `${relative}: loading label is not localized.`);
  requireThat(html.includes('<noscript>'), `${relative}: localized noscript message is missing.`);
  requireThat(html.includes(`<script type="module" src="${assetUrl('/js/app.js')}"></script>`), `${relative}: app module is missing.`);
  for (const property of ['og:title', 'og:description', 'og:url', 'og:image']) requireThat(html.includes(`property="${property}" content="`), `${relative}: missing ${property}.`);
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] || '';
  for (const directive of ["default-src 'self'", "script-src 'self'", "style-src 'self'", "img-src 'self' data:", "font-src 'self'", "connect-src 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"]) {
    requireThat(csp.includes(directive), `${relative}: missing CSP ${directive}.`);
  }
  const schemas = [];
  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc=/.test(match[1])) continue;
    if (!match[1].includes('type="application/ld+json"')) {
      failures.push(`${relative}: executable inline script is not allowed.`);
      continue;
    }
    requireThat(csp.includes(`'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`), `${relative}: JSON-LD hash is missing from the CSP.`);
    try { schemas.push(JSON.parse(match[2])); } catch { failures.push(`${relative}: invalid JSON-LD.`); }
  }
  requireThat(schemas.some(schema => schema['@type'] === 'Organization' && schema.name === 'Floricultura'), `${relative}: Organization data is missing.`);
  if (key === 'product') {
    const product = products.find(entry => entry.id === id);
    const schema = schemas.find(entry => entry['@type'] === 'Product');
    requireThat(schema?.name === product?.name, `${relative}: Product data does not match the route.`);
    requireThat(schema && !Object.hasOwn(schema, 'offers'), `${relative}: demo Product data must not publish real offers.`);
  }
}

const assetReferences = new Set(['/styles.css', '/js/app.js', '/assets/favicon.svg', '/assets/hero.webp', '/assets/atelier.webp']);
for (const product of products) for (const asset of product.images || []) assetReferences.add(asset);
const distFiles = await filesUnder(dist);
for (const file of distFiles.filter(file => /\.(?:html|css|js)$/.test(file))) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/(?:\b(?:src|href)\s*=\s*['"]|\burl\(\s*['"]?|['"`])(\/(?:assets|js)\/[^'"`\s)<>]+|\/styles\.css)/g)) {
    if (!match[1].includes('${')) assetReferences.add(match[1].split(/[?#]/)[0]);
  }
  for(const match of source.matchAll(/url\(['"]?\.\/(assets\/[^'")]+)['"]?\)/g))assetReferences.add('/'+match[1]);
}
for (const asset of assetReferences) requireThat(await exists(path.join(dist, asset.slice(1))), `Missing referenced local asset ${asset}.`);

for (const relative of ['robots.txt', 'sitemap.xml', '_headers']) requireThat(await exists(path.join(dist, relative)), `Missing generated ${relative}.`);
if (await exists(path.join(dist, 'robots.txt'))) {
  const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
  requireThat(robots.includes(`Disallow: ${basePath}/`), 'robots.txt must disallow indexing of the demo.');
  requireThat(robots.includes(`Sitemap: ${origin}${basePath}/sitemap.xml`), 'robots.txt has the wrong sitemap origin.');
}
if (await exists(path.join(dist, 'sitemap.xml'))) {
  const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
  for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    requireThat(match[1].startsWith(`${origin}/`), `Sitemap contains an unexpected origin: ${match[1]}.`);
    const parsed = parseRoute(new URL(match[1]).pathname);
    requireThat(!['cart', 'checkout', 'notFound'].includes(parsed.key), `Sitemap must exclude private flow and error pages: ${match[1]}.`);
  }
}

if (failures.length) {
  console.error(`Consistency checks failed (${failures.length}):\n${failures.map(message => `- ${message}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Syntax checked ${modules.length} JavaScript modules. Consistency checked ${locales.length} languages, ${products.length} products, ${requiredPages.size} pages and ${assetReferences.size} local assets. This check does not run ESLint or browser tests.`);
}
