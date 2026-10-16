import {basePath,stripBase} from './site.js';
export const paths = {
  'pt-br': {home:'',shop:'colecao',product:'produto',cart:'carrinho',checkout:'checkout',story:'nossa-historia',contact:'contato',faq:'perguntas-frequentes',policies:'entregas-e-politicas',privacy:'privacidade',terms:'termos'},
  en: {home:'',shop:'collection',product:'product',cart:'bag',checkout:'checkout',story:'our-story',contact:'contact',faq:'faq',policies:'delivery-and-policies',privacy:'privacy',terms:'terms'},
  es: {home:'',shop:'coleccion',product:'producto',cart:'bolsa',checkout:'checkout',story:'nuestra-historia',contact:'contacto',faq:'preguntas-frecuentes',policies:'entregas-y-politicas',privacy:'privacidad',terms:'terminos'}
};
export function routeFor(locale, key = 'home', id = '') {
  const safeLocale = Object.hasOwn(paths,locale) ? locale : 'pt-br';
  if (!Object.hasOwn(paths[safeLocale], key)) return `${basePath}/${safeLocale}/404`;
  const slug = paths[safeLocale][key];
  return `${basePath}/${safeLocale}${slug ? `/${slug}` : ''}${key === 'product' ? `/${encodeURIComponent(id)}` : ''}`;
}
export function parseRoute(pathname) {
  const local = stripBase(pathname);
  if (local === null) return {locale:'pt-br',key:'notFound',id:''};
  const segments = local.split('/').filter(Boolean);
  const locale = Object.hasOwn(paths,segments[0]) ? segments[0] : 'pt-br';
  if (!segments.length) return {locale,key:'home',id:''};
  if (segments[0] !== locale) return {locale,key:'notFound',id:''};
  const slug = segments[1] || '';
  const key = Object.keys(paths[locale]).find(k => paths[locale][k] === slug);
  if (!key || segments.length > (key === 'product' ? 3 : 2) || (key === 'product' && !segments[2])) return {locale,key:'notFound',id:''};
  try {
    return {locale,key,id:segments[2] ? decodeURIComponent(segments[2]) : ''};
  } catch {
    return {locale,key:'notFound',id:''};
  }
}
