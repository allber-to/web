/**
 * Allberto — organização do menu segundo a proposta.
 *
 * Não cria nem remove módulos: recebe a navegação real do Ninja
 * (`useNavigation`, com permissões, módulos habilitados e eventos de
 * visibilidade) e apenas a reordena em "principal" e "Mais".
 */

import type { NavigationItem } from '../components/DesktopSidebar';

export const PRIMARY_NAVIGATION_ORDER = [
  '/dashboard',
  '/clients',
  '/recurring_invoices',
  '/invoices',
  '/payments',
  '/quotes',
  '/products',
  '/reports',
  '/settings',
] as const;

function primaryIndex(href: string) {
  return PRIMARY_NAVIGATION_ORDER.findIndex(
    (prefix) => href === prefix || href.startsWith(`${prefix}/`)
  );
}

export function organizeNavigation(items: NavigationItem[]) {
  const primary: NavigationItem[] = [];
  const more: NavigationItem[] = [];

  for (const item of items) {
    (primaryIndex(item.href) === -1 ? more : primary).push(item);
  }

  primary.sort((a, b) => primaryIndex(a.href) - primaryIndex(b.href));

  return {
    primary: primary.filter((item) => item.visible),
    // Itens desconhecidos (ex.: módulos novos do upstream) vão para "Mais",
    // na ordem original, para nunca sumirem do menu.
    more: more.filter((item) => item.visible),
  };
}

export function isNavigationItemActive(pathname: string, href: string) {
  if (href.startsWith('/settings')) {
    return pathname.startsWith('/settings');
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
