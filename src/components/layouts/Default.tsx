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
import { useAtomValue } from 'jotai';
import { FormEvent, ReactElement, ReactNode, useEffect, useState } from 'react';
import { Info } from 'react-feather';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useColorScheme } from '$app/common/colors';
import { isDemo, isHosted, isSelfHosted, trans } from '$app/common/helpers';
import { useCurrentCompanyUser } from '$app/common/hooks/useCurrentCompanyUser';
import { useCurrentUser } from '$app/common/hooks/useCurrentUser';
import { usePreventNavigation } from '$app/common/hooks/usePreventNavigation';
import { useReactSettings } from '$app/common/hooks/useReactSettings';
import { useUnlockButtonForHosted } from '$app/common/hooks/useUnlockButtonForHosted';
import { useUnlockButtonForSelfHosted } from '$app/common/hooks/useUnlockButtonForSelfHosted';
import { Invoice } from '$app/common/interfaces/invoice';
import { useSocketEvent } from '$app/common/queries/sockets';
import { Breadcrumbs, Page } from '$app/components/Breadcrumbs';
import { Dropdown } from '$app/components/dropdown/Dropdown';
import { DropdownElement } from '$app/components/dropdown/DropdownElement';
import { Button, Link } from '$app/components/forms';
import {
  saveBtnAtom,
  useNavigationTopRightElement,
} from '$app/components/layouts/common/hooks';
import CommonProps from '../../common/interfaces/common-props.interface';
import { ActivateCompany } from '../banners/ActivateCompany';
import { EInvoiceCredits } from '../banners/EInvoiceCredits';
import { PriceIncreaseBanner } from '../banners/PriceIncrease';
import { VerifyEmail } from '../banners/VerifyEmail';
import { VerifyPhone } from '../banners/VerifyPhone';
import { Feedback } from '../Feedback';
import { AccountPlanExpired } from '../banners/AccountPlanExpired';
import { useNavigation } from './common/navigation';
import { DesktopSidebar } from './components/DesktopSidebar';
import { MobileSidebar } from './components/MobileSidebar';
import { Topbar } from './components/Topbar';

export interface SaveOption {
  label: string;
  onClick: (event: FormEvent<HTMLFormElement>) => unknown;
  icon?: ReactElement;
}

interface Props extends CommonProps {
  title?: string | null;
  onSaveClick?: any;
  onCancelClick?: any;
  breadcrumbs: Page[];
  topRight?: ReactNode;
  docsLink?: string;
  navigationTopRight?: ReactNode;
  saveButtonLabel?: string | null;
  disableSaveButton?: boolean;
  additionalSaveOptions?: SaveOption[];
  aboveMainContainer?: ReactNode;
  afterBreadcrumbs?: ReactNode;
  /** Allberto: a página desenha o próprio cabeçalho (ex.: Painel). */
  withoutPageTitle?: boolean;
  /** Allberto: largura/padding da composição do Painel. */
  contentVariant?: 'default' | 'dashboard';
}

export function Default(props: Props) {
  const [t] = useTranslation();

  const colors = useColorScheme();

  const preventNavigation = usePreventNavigation();

  const user = useCurrentUser();
  const companyUser = useCurrentCompanyUser();
  const reactSettings = useReactSettings();

  const isDarkMode = Boolean(reactSettings.dark_mode);

  const hostedUnlock = useUnlockButtonForHosted();
  const selfHostedUnlock = useUnlockButtonForSelfHosted();

  const shouldShowUnlockButton =
    !isDemo() && (hostedUnlock || selfHostedUnlock);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const navigation = useNavigation();

  const saveBtn = useAtomValue(saveBtnAtom);
  const navigationTopRightElement = useNavigationTopRightElement();

  useSocketEvent<Invoice>({
    on: ['App\\Events\\Invoice\\InvoiceWasViewed'],
    callback: ({ data }) => {
      if (
        !companyUser?.notifications.email.includes('invoice_viewed') ||
        !companyUser?.notifications.email.includes('invoice_viewed_user')
      ) {
        return;
      }

      toast(
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1">
            <Info size={18} />
            <span>
              {trans('notification_invoice_viewed_subject', {
                invoice: data.number,
                client: data.client?.display_name,
              })}
              .
            </span>
          </span>

          <div className="flex justify-center">
            <Link to={`/invoices/${data.id}/edit`}>{t('view_invoice')}</Link>
          </div>
        </div>,
        {
          duration: 8000,
          position: 'top-center',
        }
      );
    },
  });

  const navigate = useNavigate();

  // Tokens --ab-* (src/resources/css/allberto.css) seguem a preferência real.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.abTheme = isDarkMode ? 'dark' : 'light';
    }
  }, [isDarkMode]);

  const hasPageTitle = Boolean(props.title) && !props.withoutPageTitle;
  const hasBreadcrumbs = Boolean(props.breadcrumbs?.length);
  const hasActions = Boolean(
    props.topRight ||
      props.onCancelClick ||
      props.onSaveClick ||
      saveBtn ||
      navigationTopRightElement ||
      props.navigationTopRight
  );

  return (
    <div className="ab-shell">
      <div className="fixed bottom-4 right-4 z-50 flex items-end flex-col-reverse space-y-4 space-y-reverse">
        <ActivateCompany />
        <VerifyEmail />
        <VerifyPhone />
        <EInvoiceCredits />
        <AccountPlanExpired />

        {/* This component is only created for December 2025 if you see it in 2026 you can remove and delete it */}
        <PriceIncreaseBanner />
      </div>

      <MobileSidebar
        navigation={navigation}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <Topbar
        isMenuOpen={sidebarOpen}
        onOpenMenu={() => setSidebarOpen(true)}
        extra={
          shouldShowUnlockButton && (
            <button
              type="button"
              className="hidden sm:inline-flex items-center justify-center px-4 rounded-md text-sm font-medium text-white relative overflow-hidden"
              style={{
                height: '2.25rem',
                background: '#2176FF',
                border: '1px solid #0062ff',
                boxShadow:
                  '0px 1px 1px 0px #1453B82E, 0px 2px 2px 0px #1453B829, 0px 5px 3px 0px #1453B817, 0px 9px 4px 0px #1453B808, 0px 15px 4px 0px #1453B800, 0px 1px 0px 0px #FFFFFF40 inset, 0px 0px 0px 1px #0062FF',
              }}
              onClick={() => {
                if (
                  isHosted() ||
                  import.meta.env.VITE_ENABLE_NEW_ACCOUNT_MANAGEMENT === 'true'
                ) {
                  return navigate('/settings/account_management');
                }

                preventNavigation({
                  url: (isSelfHosted()
                    ? import.meta.env.VITE_WHITELABEL_INVOICE_URL ||
                      'https://invoiceninja.invoicing.co/client/subscriptions/O5xe7Rwd7r/purchase'
                    : user?.company_user?.ninja_portal_url) as string,
                  externalLink: true,
                });
              }}
            >
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

              <span className="relative z-10 hidden xl:block">
                {isSelfHosted() ? t('white_label_button') : t('unlock_pro')}
              </span>

              <span className="relative z-10 xl:hidden">{t('upgrade')}</span>
            </button>
          )
        }
      />

      <div className="ab-frame">
        <DesktopSidebar navigation={navigation} docsLink={props.docsLink} />

        <main className="ab-sheet" id="main-content">
          {props.aboveMainContainer}

          {(hasPageTitle || hasBreadcrumbs || hasActions) && (
            <div className="ab-pagebar">
              <div className="flex items-center gap-3 min-w-0 flex-wrap">
                {hasPageTitle && <h1>{props.title}</h1>}

                {hasBreadcrumbs && <Breadcrumbs pages={props.breadcrumbs} />}

                {props.afterBreadcrumbs}
              </div>

              {hasActions && (
                <div className="ab-pagebar-actions">
                  {props.topRight}

                  {props.onCancelClick && (
                    <Button onClick={props.onCancelClick} type="secondary">
                      {t('cancel')}
                    </Button>
                  )}

                  {(Boolean(props.onSaveClick) || saveBtn) && (
                    <div>
                      {!props.additionalSaveOptions && (
                        <Button
                          onClick={saveBtn?.onClick || props.onSaveClick}
                          disabled={
                            saveBtn?.disableSaveButton ||
                            props.disableSaveButton
                          }
                          disableWithoutIcon
                        >
                          {(saveBtn?.label || props.saveButtonLabel) ??
                            t('save')}
                        </Button>
                      )}

                      {props.additionalSaveOptions && (
                        <div className="flex">
                          <Button
                            className="rounded-br-none rounded-tr-none px-3"
                            onClick={saveBtn?.onClick || props.onSaveClick}
                            disabled={
                              saveBtn?.disableSaveButton ||
                              props.disableSaveButton
                            }
                            disableWithoutIcon
                          >
                            {(saveBtn?.label || props.saveButtonLabel) ??
                              t('save')}
                          </Button>

                          <Dropdown
                            className="rounded-bl-none rounded-tl-none h-full px-1 border-l-1 border-y-0 border-r-0"
                            cardActions
                            disabled={
                              saveBtn?.disableSaveButton ||
                              props.disableSaveButton
                            }
                            labelButtonBorderColor={colors.$1}
                          >
                            {props.additionalSaveOptions.map(
                              (option, index) => (
                                <DropdownElement
                                  key={index}
                                  icon={option.icon}
                                  disabled={props.disableSaveButton}
                                  onClick={option.onClick}
                                >
                                  {option.label}
                                </DropdownElement>
                              )
                            )}
                          </Dropdown>
                        </div>
                      )}
                    </div>
                  )}

                  {(navigationTopRightElement || props.navigationTopRight) && (
                    <div className="flex space-x-3 items-center">
                      {navigationTopRightElement?.element ||
                        props.navigationTopRight}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div
            style={{ color: colors.$3 }}
            className={classNames({
              'ab-content': props.contentVariant !== 'dashboard',
              'ab-content--dashboard': props.contentVariant === 'dashboard',
            })}
          >
            {props.children}
          </div>
        </main>
      </div>

      <Feedback />
    </div>
  );
}
