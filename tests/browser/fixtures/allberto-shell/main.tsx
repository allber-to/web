/**
 * Fixture LOCAL de testes: renderiza a shell real (Default) e o Painel real
 * com estado fictício em memória, sem backend e sem rede (ver network.ts).
 *
 * Parâmetros: ?theme=dark ?mini=1 ?hide=1 ?state=data|empty|loading|error
 * ?route=/dashboard|/clients
 */

import './network';
import '$app/resources/css/app.css';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { createInstance } from 'i18next';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { reactSettingsAtom } from '$app/common/hooks/useReactSettings';
import { companyDocumentSlice } from '$app/common/stores/slices/company-documents';
import { companyUserSlice } from '$app/common/stores/slices/company-users';
import { productsSlice } from '$app/common/stores/slices/products';
import { settingsSlice } from '$app/common/stores/slices/settings';
import { userSlice } from '$app/common/stores/slices/user';
import { Default } from '$app/components/layouts/Default';
import { HIDE_VALUES_STORAGE_KEY } from '$app/components/layouts/common/privacy';
import Clients from '$app/pages/clients/index/Clients';
import Dashboard from '$app/pages/dashboard/Dashboard';
import en from '$app/resources/lang/en/en.json';
import translations from '$app/resources/lang/pt_BR/pt_BR.json';

const params = new URLSearchParams(window.location.search);
const dark = params.get('theme') === 'dark';

try {
  window.localStorage.setItem(
    HIDE_VALUES_STORAGE_KEY,
    params.get('hide') === '1' ? 'true' : 'false'
  );
} catch {
  // Sem storage: a máscara começa desligada.
}

dayjs.locale('pt-br');

const company = {
  id: 'company-fixture',
  enabled_modules: 0x7fffffff,
  settings: {
    name: 'allberto (fictício)',
    country_id: '76',
    currency_id: '12',
    company_logo: '',
    date_format_id: '1',
    translations: {},
  },
};

const user = {
  id: 'user-fixture',
  first_name: 'Usuária',
  last_name: 'Exemplo',
  email: 'pessoa@example.test',
};

const companyUser = {
  id: 'cu-fixture',
  is_admin: true,
  is_owner: true,
  permissions: '',
  notifications: { email: [] },
  react_settings: {},
  account: { plan: 'pro', plan_expires: '', is_scheduler_running: true },
  company,
  user,
  ninja_portal_url: '',
};

const store = configureStore({
  reducer: {
    companyUsers: companyUserSlice.reducer,
    companyDocuments: companyDocumentSlice.reducer,
    user: userSlice.reducer,
    products: productsSlice.reducer,
    settings: settingsSlice.reducer,
  },
  preloadedState: {
    companyUsers: {
      currentIndex: 0,
      api: [companyUser],
      changes: { company: undefined },
    },
    user: { authenticated: true, user, changes: {} },
  } as never,
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});

const jotai = createStore();
jotai.set(reactSettingsAtom, {
  dark_mode: dark,
  show_mini_sidebar: params.get('mini') === '1',
  dashboard_fields: [],
  preferences: {
    dashboard_charts: {
      currency: 12,
      default_view: 'month',
      range: 'this_month',
    },
  },
} as never);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

queryClient.setQueryData(['/api/v1/statics'], {
  currencies: [
    {
      id: '12',
      name: 'Brazilian Real',
      code: 'BRL',
      symbol: 'R$',
      precision: 2,
      thousand_separator: '.',
      decimal_separator: ',',
      swap_currency_symbol: false,
      exchange_rate: 1,
    },
  ],
  countries: [
    {
      id: '76',
      name: 'Brazil',
      iso_3166_2: 'BR',
      thousand_separator: '.',
      decimal_separator: ',',
      swap_currency_symbol: false,
    },
  ],
  date_formats: [{ id: '1', format: 'd/m/Y', format_moment: 'DD/MM/YYYY' }],
});

const i18n = createInstance();

void i18n
  .init({
    lng: params.get('lang') ?? 'pt_BR',
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      pt_BR: { translation: translations },
    },
    interpolation: { escapeValue: false },
  })
  .then(() => {
    createRoot(document.getElementById('fixture-root')!).render(
      <Provider store={store}>
        <JotaiProvider store={jotai}>
          <QueryClientProvider client={queryClient}>
            <I18nextProvider i18n={i18n}>
              <MemoryRouter
                initialEntries={[params.get('route') ?? '/dashboard']}
              >
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route
                    path="*"
                    element={
                      <Default title="Clientes" breadcrumbs={[]}>
                        <p>Rota fora do escopo da fixture.</p>
                      </Default>
                    }
                  />
                </Routes>
              </MemoryRouter>
            </I18nextProvider>
          </QueryClientProvider>
        </JotaiProvider>
      </Provider>
    );
  });
