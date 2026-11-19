/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { X } from 'react-feather';
import { useTranslation } from 'react-i18next';
import { CompanySwitcher } from '$app/components/CompanySwitcher';
import { HelpSidebarIcons } from '$app/components/HelpSidebarIcons';
import { NavigationItem, SidebarNavigation } from './DesktopSidebar';

interface Props {
  navigation: NavigationItem[];
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Gaveta de navegação (≤ 860 px). O Dialog do Headless UI fornece
 * aria-modal, contenção de foco, Escape, clique fora e devolução do foco ao
 * botão que abriu a gaveta. O fundo fica inerte enquanto aberta.
 */
export function MobileSidebar(props: Props) {
  const [t] = useTranslation();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (props.sidebarOpen) setIsNavigating(false);
  }, [props.sidebarOpen]);

  const close = () => props.setSidebarOpen(false);
  const closeForNavigation = () => {
    setIsNavigating(true);
    close();
  };

  // A protected navigation opens another Dialog. Remove this focus trap in
  // the same commit rather than keeping it alive for the leave animation.
  if (isNavigating && !props.sidebarOpen) return null;

  return (
    <Transition.Root show={props.sidebarOpen} as={Fragment}>
      <Dialog
        as="div"
        className="ab-drawer-root fixed inset-0 z-40 flex"
        onClose={close}
        initialFocus={closeButtonRef}
      >
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-200 motion-reduce:transition-none"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-200 motion-reduce:transition-none"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="ab-drawer-overlay" aria-hidden="true" />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="transition ease-out duration-200 motion-reduce:transition-none"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-in duration-150 motion-reduce:transition-none"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <Dialog.Panel className="ab-drawer-panel">
            <Dialog.Title className="sr-only">{t('menu')}</Dialog.Title>

            <div className="ab-drawer-head">
              <div className="min-w-0 flex-1">
                <CompanySwitcher variant="drawer" />
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                className="ab-icon-btn"
                style={{ width: 44, height: 44 }}
                onClick={close}
                aria-label={t('close') as string}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <SidebarNavigation
              navigation={props.navigation}
              mini={false}
              onNavigate={closeForNavigation}
            />

            <div className="ab-side-foot">
              <HelpSidebarIcons mobileNavbar />
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  );
}
