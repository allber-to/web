/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useAtomValue } from 'jotai';
import { CSSProperties, MouseEvent, ReactNode } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { preventLeavingPageAtom } from '$app/common/hooks/useAddPreventNavigationEvents';
import { usePreventNavigation } from '$app/common/hooks/usePreventNavigation';
import { useReactSettings } from '$app/common/hooks/useReactSettings';
import { Tooltip } from '$app/components/Tooltip';
import { useThemeColorScheme } from '$app/pages/settings/user/components/StatusColorTheme';
import { isNavigationItemActive } from '../common/allberto-navigation';
import { NavigationItem } from './DesktopSidebar';

interface NavLinkProps {
  to: string;
  className?: string;
  style?: CSSProperties;
  current?: boolean;
  label?: string;
  children: ReactNode;
  onNavigate?: () => void;
}

/** Link de navegação que respeita a proteção de "alterações não salvas". */
export function NavLink(props: NavLinkProps) {
  const { prevent: preventLeavingPage } = useAtomValue(preventLeavingPageAtom);
  const preventNavigation = usePreventNavigation();

  return (
    <RouterLink
      to={props.to}
      className={props.className}
      style={props.style}
      aria-current={props.current ? 'page' : undefined}
      aria-label={props.label}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (preventLeavingPage) {
          event.preventDefault();
          props.onNavigate?.();
          preventNavigation({ url: props.to });
          return;
        }

        props.onNavigate?.();
      }}
    >
      {props.children}
    </RouterLink>
  );
}

interface Props {
  item: NavigationItem;
  /** Força a versão só com ícone (sidebar mini). */
  mini?: boolean;
  onNavigate?: () => void;
}

export function SidebarItem(props: Props) {
  const { item } = props;

  const reactSettings = useReactSettings();
  const themeColors = useThemeColorScheme();
  const location = useLocation();

  const isMini = props.mini ?? Boolean(reactSettings.show_mini_sidebar);

  if (!item.visible) {
    return null;
  }

  const current = isNavigationItemActive(location.pathname, item.href);

  // Cores personalizadas do usuário (Configurações › Tema) continuam valendo.
  const customStyle = (active: boolean): CSSProperties => ({
    backgroundColor: (active ? themeColors.$1 : themeColors.$3) || undefined,
    color: (active ? themeColors.$2 : themeColors.$4) || undefined,
  });

  const link = (
    <NavLink
      to={item.href}
      current={current}
      className="ab-navitem"
      style={{
        ...customStyle(current),
        justifyContent: isMini ? 'center' : undefined,
      }}
      label={isMini ? item.name : undefined}
      onNavigate={props.onNavigate}
    >
      <span className="ab-navicon" aria-hidden="true">
        <item.icon size="1.15rem" color="currentColor" />
      </span>

      {!isMini && <span className="ab-navlabel">{item.name}</span>}
    </NavLink>
  );

  const showSubOptions =
    !isMini &&
    item.subOptions &&
    (current ||
      item.subOptions.some((sub) =>
        isNavigationItemActive(location.pathname, sub.href)
      ));

  return (
    <div className="flex flex-col">
      <div className="ab-navrow">
        {isMini ? (
          <Tooltip
            message={item.name}
            width="auto"
            placement="right"
            withoutArrow
            withoutWrapping
          >
            {link}
          </Tooltip>
        ) : (
          link
        )}

        {item.rightButton && !isMini && item.rightButton.visible && (
          <NavLink
            to={item.rightButton.to}
            className="ab-navadd"
            label={
              item.rightButton.tooltipLabel
                ? `${item.rightButton.label} (${item.rightButton.tooltipLabel})`
                : item.rightButton.label
            }
            onNavigate={props.onNavigate}
          >
            <item.rightButton.icon size="1rem" color="currentColor" />
          </NavLink>
        )}
      </div>

      {showSubOptions && (
        <div className="ab-navsub">
          {item.subOptions?.map((subOption) => {
            if (!subOption.visible) {
              return null;
            }

            const subCurrent = isNavigationItemActive(
              location.pathname,
              subOption.href
            );

            return (
              <div key={subOption.href} className="ab-navrow">
                <NavLink
                  to={subOption.href}
                  current={subCurrent}
                  className="ab-navitem"
                  style={customStyle(subCurrent)}
                  onNavigate={props.onNavigate}
                >
                  <span className="ab-navicon" aria-hidden="true">
                    <subOption.icon size="1.1rem" color="currentColor" />
                  </span>
                  <span className="ab-navlabel">{subOption.name}</span>
                </NavLink>

                {subOption.rightButton && subOption.rightButton.visible && (
                  <NavLink
                    to={subOption.rightButton.to}
                    className="ab-navadd"
                    label={subOption.rightButton.label}
                    onNavigate={props.onNavigate}
                  >
                    <subOption.rightButton.icon
                      size="1rem"
                      color="currentColor"
                    />
                  </NavLink>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
