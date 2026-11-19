/**
 * Allberto — "Primeiros passos" (estado conta nova da proposta).
 *
 * Cada etapa só é marcada concluída/pendente quando uma consulta real com
 * permissão suficiente comprova; caso contrário aparece "não verificado".
 * Nada é inferido de MRR/saldo zero. As ações levam a fluxos reais do Ninja.
 */

import { Check, Circle, HelpCircle } from 'react-feather';
import { useTranslation } from 'react-i18next';
import {
  useAdmin,
  useHasPermission,
} from '$app/common/hooks/permissions/useHasPermission';
import { useCompanyGatewaysQuery } from '$app/common/queries/company-gateways';
import { NavLink } from '$app/components/layouts/components/SidebarItem';
import {
  paginationTotal,
  shouldShowOnboarding,
  StepStatus,
  stepFromTotal,
} from '../../helpers/allberto-dashboard';
import { useEntityTotal } from '../../hooks/useAllbertoQueries';

interface Action {
  to: string;
  label: string;
  visible: boolean;
}

interface StepProps {
  title: string;
  status: StepStatus;
  actions?: Action[];
}

function StatusPill(props: { status: StepStatus }) {
  const [t] = useTranslation();

  if (props.status === 'done') {
    return (
      <span className="ab-pill ab-pill--ok">{t('allberto_step_done')}</span>
    );
  }

  if (props.status === 'pending') {
    return (
      <span className="ab-pill ab-pill--warn">
        {t('allberto_step_pending')}
      </span>
    );
  }

  return <span className="ab-pill">{t('allberto_step_unknown')}</span>;
}

function Step(props: StepProps) {
  const Icon =
    props.status === 'done'
      ? Check
      : props.status === 'pending'
        ? Circle
        : HelpCircle;

  const actions = (props.actions ?? []).filter((action) => action.visible);

  return (
    <li className="ab-step" data-status={props.status}>
      <span className="ab-step-icon" aria-hidden="true">
        <Icon size={16} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-semibold">{props.title}</p>
        <StatusPill status={props.status} />
      </div>

      {props.status !== 'done' && actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action, index) => (
            <NavLink
              key={action.to}
              to={action.to}
              className={`ab-btn ab-btn--sm ${index === 0 ? 'ab-btn--primary' : 'ab-btn--secondary'}`}
            >
              {action.label}
            </NavLink>
          ))}
        </div>
      )}
    </li>
  );
}

export function Onboarding() {
  const [t] = useTranslation();
  const hasPermission = useHasPermission();
  const { isAdmin } = useAdmin();

  // Só conta quem pode ver todos os registros; sem isso, zero não prova nada.
  const canCountClients = hasPermission('view_client');
  const canCountRecurring = hasPermission('view_recurring_invoice');

  const clients = useEntityTotal('clients', canCountClients);
  const recurring = useEntityTotal('recurring_invoices', canCountRecurring);
  const gateways = useCompanyGatewaysQuery({ perPage: '1' });

  const clientStep = stepFromTotal(
    canCountClients && clients.isSuccess ? paginationTotal(clients.data) : null
  );
  const recurringStep = stepFromTotal(
    canCountRecurring && recurring.isSuccess
      ? paginationTotal(recurring.data)
      : null
  );
  const gatewayStep = stepFromTotal(
    isAdmin && gateways.isSuccess ? paginationTotal(gateways.data?.data) : null
  );

  if (!shouldShowOnboarding([gatewayStep, clientStep, recurringStep])) {
    return null;
  }

  return (
    <section className="ab-card p-5" aria-labelledby="ab-onboarding">
      <h2 id="ab-onboarding" className="ab-h2">
        {t('allberto_onboarding_title')}
      </h2>
      <p className="ab-sub mt-1">{t('allberto_onboarding_hint')}</p>

      <ol className="ab-steps">
        <Step title={t('allberto_step_account')} status="done" />

        <Step
          title={t('allberto_step_gateway')}
          status={gatewayStep}
          actions={[
            {
              to: '/settings/gateways/create',
              label: t('add_gateway'),
              visible: isAdmin,
            },
          ]}
        />

        <Step
          title={t('allberto_step_client')}
          status={clientStep}
          actions={[
            {
              to: '/clients/create',
              label: t('new_client'),
              visible: hasPermission('create_client'),
            },
            {
              to: '/clients/import',
              label: t('import'),
              visible:
                hasPermission('create_client') || hasPermission('edit_client'),
            },
          ]}
        />

        <Step
          title={t('allberto_step_recurring')}
          status={recurringStep}
          actions={[
            {
              to: '/recurring_invoices/create',
              label: t('new_recurring_invoice'),
              visible: hasPermission('create_recurring_invoice'),
            },
          ]}
        />
      </ol>
    </section>
  );
}
