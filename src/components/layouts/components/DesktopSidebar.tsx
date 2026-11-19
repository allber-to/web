/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import classNames from 'classnames';
import { useEffect, useId, useState } from 'react';
import { ChevronDown, MoreHorizontal } from 'react-feather';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useReactSettings } from '$app/common/hooks/useReactSettings';
import { HelpSidebarIcons } from '$app/components/HelpSidebarIcons';
import { Tooltip } from '$app/components/Tooltip';
import {
  isNavigationItemActive,
  organizeNavigation,
} from '../common/allberto-navigation';
import { SidebarItem } from './SidebarItem';

interface SubNavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  visible: boolean;
  rightButton?: {
    icon: React.ElementType;
    to: string;
    label: string;
    visible: boolean;
  };
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  visible: boolean;
  rightButton?: {
    icon: React.ElementType;
    to: string;
    label: string;
    visible: boolean;
    tooltipLabel?: string;
  };
  subOptions?: SubNavigationItem[];
}

interface NavigationListProps {
  navigation: NavigationItem[];
  mini?: boolean;
  onNavigate?: () => void;
}

/** Lista principal + grupo "Mais", compartilhada por sidebar e gaveta. */
export function SidebarNavigation(props: NavigationListProps) {
  const [t] = useTranslation();
  const location = useLocation();
  const moreId = useId();

  const { primary, more } = organizeNavigation(props.navigation);

  const moreIsCurrent = more.some(
    (item) =>
      isNavigationItemActive(location.pathname, item.href) ||
      item.subOptions?.some((sub) =>
        isNavigationItemActive(location.pathname, sub.href)
      )
  );

  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(moreIsCurrent);

  useEffect(() => {
    if (moreIsCurrent) {
      setIsMoreOpen(true);
    }
  }, [moreIsCurrent]);

  const moreButton = (
    <button
      type="button"
      className="ab-navitem"
      aria-expanded={isMoreOpen}
      aria-controls={moreId}
      aria-label={props.mini ? t('more') : undefined}
      onClick={() => setIsMoreOpen((current) => !current)}
      style={{ justifyContent: props.mini ? 'center' : undefined }}
    >
      <span className="ab-navicon" aria-hidden="true">
        <MoreHorizontal size={18} />
      </span>

      {!props.mini && (
        <>
          <span className="ab-navlabel">{t('more')}</span>
          <span className="ab-cnt" aria-hidden="true">
            {more.length}
          </span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            style={{
              transform: isMoreOpen ? 'rotate(180deg)' : undefined,
              transition: 'transform .12s',
            }}
          />
        </>
      )}
    </button>
  );

  return (
    <nav
      className="ab-nav"
      data-cy="navigationBar"
      aria-label={t('menu') as string}
    >
      {primary.map((item) => (
        <SidebarItem
          key={item.href}
          item={item}
          mini={props.mini}
          onNavigate={props.onNavigate}
        />
      ))}

      {more.length > 0 && (
        <>
          <div className="ab-nav-sep" aria-hidden="true" />

          {props.mini ? (
            <Tooltip
              message={t('more') as string}
              width="auto"
              placement="right"
              withoutArrow
              withoutWrapping
            >
              {moreButton}
            </Tooltip>
          ) : (
            moreButton
          )}

          {isMoreOpen && (
            <div id={moreId} className="flex flex-col gap-0.5">
              {more.map((item) => (
                <SidebarItem
                  key={item.href}
                  item={item}
                  mini={props.mini}
                  onNavigate={props.onNavigate}
                />
              ))}
            </div>
          )}
        </>
      )}
    </nav>
  );
}

interface Props {
  navigation: NavigationItem[];
  docsLink?: string;
}

export function DesktopSidebar(props: Props) {
  const reactSettings = useReactSettings();

  const isMiniSidebar = Boolean(reactSettings.show_mini_sidebar);

  return (
    <aside
      className={classNames('ab-side', { 'ab-side--mini': isMiniSidebar })}
    >
      <SidebarNavigation navigation={props.navigation} mini={isMiniSidebar} />

      <div className="ab-side-foot">
        <HelpSidebarIcons docsLink={props.docsLink} />
      </div>
    </aside>
  );
}
