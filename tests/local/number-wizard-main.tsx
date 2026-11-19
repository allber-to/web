/** Isolated numeric regression: real wizard/stores, shared synthetic fixtures, no auth bootstrap. */
import { Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getDefaultStore } from 'jotai';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { store } from '$app/common/stores/store';
import { updateCompanyUsers } from '$app/common/stores/slices/company-users';
import { updateUser } from '$app/common/stores/slices/user';
import {
  reactSettingsAtom,
  preferencesDefaults,
} from '$app/common/hooks/useReactSettings';
import Wizard from '$app/pages/invoices/wizard/Wizard';
import Items from '$app/pages/invoices/wizard/steps/Items';
import Payment from '$app/pages/invoices/wizard/steps/Payment';
import Notes from '$app/pages/invoices/wizard/steps/Notes';
import Send from '$app/pages/invoices/wizard/steps/Send';
import en from '$app/resources/lang/en/en.json';
import ptBR from '$app/resources/lang/pt_BR/pt_BR.json';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import '$app/resources/css/app.css';
import { PreventNavigationModal } from '$app/components/PreventNavigationModal';
import { companyUser, user, statics } from './fixtures';

const params = new URLSearchParams(location.search);
const language = params.get('lang') === 'pt_BR' ? 'pt_BR' : 'en';
document.documentElement.lang = language.replace('_', '-');
dayjs.locale(language === 'pt_BR' ? 'pt-br' : 'en');
localStorage.setItem('X-NINJA-TOKEN', 'LOCAL-FIXTURE-NOT-A-CREDENTIAL');
localStorage.setItem('X-CURRENT-INDEX', '0');
// Seed an explicitly synthetic Redux wire payload; auth/bootstrap is outside this harness.
store.dispatch({ type: updateCompanyUsers.type, payload: [companyUser] });
store.dispatch(updateUser(user));
getDefaultStore().set(reactSettingsAtom, {
  show_pdf_preview: false,
  react_notification_link: false,
  persist_table_filters: false,
  dark_mode: params.get('theme') === 'dark',
  preferences: {
    ...preferencesDefaults,
    enable_public_notifications: false,
    feedback_slider_displayed_at: -1,
  },
});
const queries = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
    mutations: { retry: false },
  },
});
queries.setQueryData(['/api/v1/statics'], statics);
// The existing self-hosted sidebar checks a hard-coded public version URL.
// Prime that exact read-only query so manual inspection never contacts it.
queries.setQueryData(['/pdf.invoicing.co/api/version'], '5.0.0-local');
class Boundary extends Component<{ children: ReactNode }, { error?: string }> {
  state: { error?: string } = {};
  static getDerivedStateFromError(error: Error) {
    return { error: error.stack || error.message };
  }
  render() {
    return this.state.error ? (
      <pre data-testid="render-error">{this.state.error}</pre>
    ) : (
      this.props.children
    );
  }
}
function SurfaceRoutes() {
  const location = useLocation();
  return (
    <div data-testid="local-surface" data-path={location.pathname}>
      <PreventNavigationModal />
      <Routes>
        <Route path="/invoices/guided" element={<Wizard />}>
          <Route path="items" element={<Items />} />
          <Route path="payment" element={<Payment />} />
          <Route path="notes" element={<Notes />} />
          <Route path="send" element={<Send />} />
        </Route>
        <Route
          path="*"
          element={
            <p data-testid="unmounted-route">
              Route outside local validation scope: {location.pathname}
            </p>
          }
        />
      </Routes>
    </div>
  );
}
void i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, pt_BR: { translation: ptBR } },
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <Boundary>
        <Provider store={store}>
          <QueryClientProvider client={queries}>
            <MemoryRouter
              initialEntries={[params.get('route') || '/dashboard']}
              future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
              <SurfaceRoutes />
            </MemoryRouter>
          </QueryClientProvider>
        </Provider>
      </Boundary>
    );
  });
