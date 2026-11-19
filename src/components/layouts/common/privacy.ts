/**
 * Allberto — "ocultar valores".
 *
 * Privacidade VISUAL (olhares por cima do ombro), não controle de acesso:
 * os dados continuam sendo carregados conforme as permissões do usuário.
 *
 * O botão da shell só aparece quando a tela atual declarou suporte via
 * `usePrivacySupport()` e aplica `maskValue` em todo valor, tooltip, gráfico
 * e nome acessível que exibe. Telas sem suporte não mostram o controle, para
 * não sugerir uma privacidade que não existe.
 */

import { atom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useEffect } from 'react';

export const HIDE_VALUES_STORAGE_KEY = 'allberto.hide_values';

export const MASKED_VALUE = '••••••';

export const hideValuesAtom = atomWithStorage<boolean>(
  HIDE_VALUES_STORAGE_KEY,
  false,
  undefined,
  { getOnInit: true }
);

/** Quantidade de superfícies montadas que implementam a máscara. */
export const privacySupportAtom = atom<number>(0);

export function usePrivacySupport() {
  const setSupport = useSetAtom(privacySupportAtom);

  useEffect(() => {
    setSupport((current) => current + 1);

    return () => setSupport((current) => Math.max(0, current - 1));
  }, [setSupport]);
}

export function maskValue(hidden: boolean, value: string): string {
  return hidden ? MASKED_VALUE : value;
}

/**
 * Máscara efetiva: só vale enquanto uma superfície com suporte está montada,
 * para nunca mascarar telas que não exibem o controle.
 */
export function useHideValues() {
  const hidden = useAtomValue(hideValuesAtom);
  const supported = useAtomValue(privacySupportAtom) > 0;

  return hidden && supported;
}
