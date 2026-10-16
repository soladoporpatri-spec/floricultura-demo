// One source of truth for project hosting. Language and market stay independent.
export const siteOrigin = 'https://soladoporpatri-spec.github.io';
export const basePath = '/floricultura-demo';
export const siteUrl = `${siteOrigin}${basePath}/`;
export const assetUrl = pathname => `${basePath}/${String(pathname).replace(/^\/+/, '')}`;
export function stripBase(pathname) {
  if (pathname === basePath || pathname === `${basePath}/`) return '/';
  return pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : null;
}
