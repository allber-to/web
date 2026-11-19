/**
 * Allberto — topbar marinho (56 px) da proposta.
 *
 * Hospeda as integrações reais do Invoice Ninja: troca de empresa/perfil
 * (CompanySwitcher), busca global com atalho (Search), criação rápida
 * (QuickCreatePopover), notificações, tema (preferência `dark_mode`) e
 * acesso aos dados do usuário. Renderizada uma única vez; o layout
 * mobile (≤ 860 px) é resolvido em CSS para não duplicar atalhos/modais.
 */

import { useAtom, useAtomValue } from 'jotai';
import { ReactNode } from 'react';
import { Eye, EyeOff, Menu, Moon, Sun } from 'react-feather';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '$app/common/hooks/useCurrentUser';
import { useHandleDarkLightMode } from '$app/common/hooks/useHandleDarkLightMode';
import { useReactSettings } from '$app/common/hooks/useReactSettings';
import { CompanySwitcher } from '$app/components/CompanySwitcher';
import { Notifications } from '$app/components/Notifications';
import { QuickCreatePopover } from '$app/components/QuickCreatePopover';
import { Search } from '$app/pages/dashboard/components/Search';
import { hideValuesAtom, privacySupportAtom } from '../common/privacy';
import { NavLink } from './SidebarItem';

export function AllbertoLogo() {
  return (
    <span className="ab-logo">
      <span>allberto</span>
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <path
          d="M60 64 V22 M60 64 L99.95 51.02 M60 64 L84.69 97.98 M60 64 L35.31 97.98 M60 64 L20.05 51.02"
          fill="none"
          stroke="currentColor"
          strokeWidth="19"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function initialsOf(
  firstName?: string,
  lastName?: string,
  email?: string
) {
  const letters = [firstName, lastName]
    .map((part) => part?.trim().charAt(0) ?? '')
    .join('');

  return (letters || email?.trim().charAt(0) || '?').toUpperCase();
}

function PrivacyToggle() {
  const [t] = useTranslation();
  const [hidden, setHidden] = useAtom(hideValuesAtom);
  const supported = useAtomValue(privacySupportAtom) > 0;

  if (!supported) {
    return null;
  }

  return (
    <button
      type="button"
      className="ab-tb-btn"
      aria-pressed={hidden}
      aria-label={
        hidden
          ? (t('allberto_show_values') as string)
          : (t('allberto_hide_values') as string)
      }
      title={
        hidden
          ? (t('allberto_show_values') as string)
          : (t('allberto_hide_values') as string)
      }
      onClick={() => setHidden(!hidden)}
    >
      {hidden ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
    </button>
  );
}

function ThemeToggle() {
  const [t] = useTranslation();
  const reactSettings = useReactSettings();
  const handleDarkLightMode = useHandleDarkLightMode();

  const isDark = Boolean(reactSettings?.dark_mode);

  return (
    <button
      type="button"
      className="ab-tb-btn"
      aria-pressed={isDark}
      aria-label={t('dark_mode') as string}
      title={t('dark_mode') as string}
      onClick={() => handleDarkLightMode(!isDark)}
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  );
}

interface Props {
  isMenuOpen: boolean;
  onOpenMenu: () => void;
  /** Botões reais preservados (ex.: Unlock Pro / White label). */
  extra?: ReactNode;
}

export function Topbar(props: Props) {
  const [t] = useTranslation();
  const user = useCurrentUser();

  const userName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.email ||
    '';

  return (
    <header className="ab-topbar" data-cy="topNavbar">
      <button
        type="button"
        className="ab-tb-btn ab-only-mobile"
        aria-label={t('menu') as string}
        aria-expanded={props.isMenuOpen}
        aria-haspopup="dialog"
        onClick={props.onOpenMenu}
      >
        <Menu aria-hidden="true" />
      </button>

      <NavLink to="/dashboard" className="ab-logo-link" label="allberto">
        <AllbertoLogo />
      </NavLink>

      <span className="ab-tb-div ab-only-desktop" aria-hidden="true" />

      <div className="ab-tb-company ab-only-desktop">
        <CompanySwitcher variant="topbar" />
      </div>

      <span className="ab-tb-spacer" aria-hidden="true" />

      <div className="ab-tb-slot ab-tb-search">
        <Search />
      </div>

      <div className="ab-tb-slot">
        <QuickCreatePopover variant="topbar" />
      </div>

      <PrivacyToggle />

      <div className="ab-tb-slot">
        <Notifications />
      </div>

      <ThemeToggle />

      {props.extra}

      <NavLink
        to="/settings/user_details"
        className="ab-avatar ab-only-desktop"
        label={`${t('user_details')}${userName ? `: ${userName}` : ''}`}
      >
        <span aria-hidden="true">
          {initialsOf(user?.first_name, user?.last_name, user?.email)}
        </span>
      </NavLink>
    </header>
  );
}
