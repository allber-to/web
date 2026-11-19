/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useReactSettingsField } from './hooks/useReactSettings';

// export const $1 = {
//   name: 'invoiceninja.dark',
//   $0: 'dark',
//   $1: '#182433',
//   $2: '#151f2c',
//   $3: '#ffffff',
//   $4: '#1f2e41',
//   $5: '#1f2e41',
//   $6: '#151f2c',
//   $7: '#151f2c',
//   $8: '#1f2e41',
//   $9: '#ffffff',
// };

// Allberto: mesmas chaves ($0…$25) do Invoice Ninja, valores da proposta
// (design/proposta-original.html). Espelham os tokens CSS --ab-* em
// src/resources/css/allberto.css; manter os dois em sincronia.
export const darkColorScheme = {
  name: 'invoiceninja.dark',
  $0: 'dark',
  $1: '#161616', // surface
  $2: '#111111', // bg (folha)
  $3: '#fafafa', // ink
  $4: '#1f1f1f', // hover / borda primária
  $5: '#262626', // linha
  $6: '#1f1f1f',
  $7: '#1f1f1f',
  $8: '#1f1f1f',
  $9: '#ffffff',
  $10: 0.87, // High emphasis text
  $11: 0.6, // Medium emphasis text
  $12: 0.38, // Disabled text
  $13: '#262626', // Navbar right icon hover
  $14: '#0a0a0a', // side (navegação)
  $15: '#1f1f1f', // Light gray background
  $16: '#a1a1aa', // Dark gray icon
  $17: '#a1a1aa', // Placeholder text, table header text color
  $18: '#545dff', // Button background color (action)
  $19: '#262626', // Light border color
  $20: '#1f1f1f', // Dropdown element hover background color
  $21: '#262626', // Divider color
  $22: '#a1a1aa', // Label color
  $23: '#111111', // Content background color
  $24: '#262626', // Border color
  $25: '#1f1f1f', // Hover element background color
};

export const lightColorScheme = {
  name: 'invoiceninja.light',
  $0: 'light',
  $1: '#ffffff', // surface
  $2: '#f7f7f5', // bg (folha)
  $3: '#18181b', // ink
  $4: '#f1f1ef', // hover / borda primária
  $5: '#e4e4e7', // linha
  $6: '#e6e6e3',
  $7: '#f1f1ef', // Primary hover
  $8: '#e6e6e3', // Secondary hover
  $9: '#ffffff', // Accent color text
  $10: 1, // High emphasis text
  $11: 0.8, // Secondary text opacity
  $12: 0.5, // Disabled text opacity
  $13: '#e4e4e7', // Navbar right icon hover
  $14: '#f1f1ef', // side (navegação)
  $15: '#e6e6e3', // Light gray background
  $16: '#71717a', // Dark gray icon
  $17: '#6b6b74', // Placeholder text, table header text color (AA)
  $18: '#545dff', // Button background color (action)
  $19: '#e4e4e7', // Light border color
  $20: '#ededed', // Dropdown element hover background color
  $21: '#e4e4e7', // Divider color
  $22: '#71717a', // Label color
  $23: '#f7f7f5', // Content background color
  $24: '#e4e4e7', // Border color
  $25: '#f1f1ef', // Hover element background color
};

export function useColorScheme() {
  const darkMode = useReactSettingsField('dark_mode');

  return darkMode ? darkColorScheme : lightColorScheme;
}
