/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import '$app/pages/allberto-entities.css';
import { Fragment } from 'react';
import { Button } from '$app/components/forms';
import { EntityStatus } from '$app/components/EntityStatus';
import { useTitle } from '$app/common/hooks/useTitle';
import { useClientQuery } from '$app/common/queries/clients';
import { Page } from '$app/components/Breadcrumbs';
import { Default } from '$app/components/layouts/Default';
import { Spinner } from '$app/components/Spinner';
import { Tabs } from '$app/components/Tabs';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { Contacts } from './components/Contacts';
import { Details } from './components/Details';
import { Standing } from './components/Standing';
import { route } from '$app/common/helpers/route';
import { Gateways } from './components/Gateways';
import { ResourceActions } from '$app/components/ResourceActions';
import { useActions } from '../common/hooks/useActions';
import { useTabs } from './hooks/useTabs';
import { useHasPermission } from '$app/common/hooks/permissions/useHasPermission';
import { useEntityAssigned } from '$app/common/hooks/useEntityAssigned';
import {
  ChangeTemplateModal,
  useChangeTemplate,
} from '$app/pages/settings/invoice-design/pages/custom-designs/components/ChangeTemplate';
import { Client as IClient } from '$app/common/interfaces/client';
import { ClientPublicNotes } from './components/ClientPublicNotes';
import { ClientPrivateNotes } from './components/ClientPrivateNotes';
import { useSocketEvent } from '$app/common/queries/sockets';
import { $refetch } from '$app/common/hooks/useRefetch';
import { PreviousNextNavigation } from '$app/components/PreviousNextNavigation';
import { InputLabel } from '$app/components/forms';
import { Address } from './components/Address';
import CardsCustomizationModal, {
  ClientShowCard,
  DEFAULT_CARDS,
} from './components/CardsCustomizationModal';
import { useReactSettings } from '$app/common/hooks/useReactSettings';
import { useRecordFiltersScope } from '$app/common/hooks/useScopedTableFilters';
import { useShouldDisplayClientGatewaysAndAutoBill } from './hooks/useShouldDisplayClientGatewaysAndAutoBill';

export default function Client() {
  const { documentTitle, setDocumentTitle } = useTitle('view_client');
  const [t] = useTranslation();

  const [isPurgeOrMergeActionCalled, setIsPurgeOrMergeActionCalled] =
    useState<boolean>(false);

  const { id } = useParams();
  const {
    data: client,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useClientQuery({
    id,
    enabled: Boolean(id) && !isPurgeOrMergeActionCalled,
  });

  const reactSettings = useReactSettings();

  useRecordFiltersScope(id);

  const pages: Page[] = [
    { name: t('clients'), href: '/clients' },
    {
      name: documentTitle,
      href: route('/clients/:id', { id }),
    },
  ];

  const tabs = useTabs({
    client,
  });
  const actions = useActions({
    setIsPurgeOrMergeActionCalled,
  });

  const navigate = useNavigate();
  const hasPermission = useHasPermission();
  const entityAssigned = useEntityAssigned();
  const shouldDisplayClientGatewaysAndAutoBill =
    useShouldDisplayClientGatewaysAndAutoBill();

  const isCardVisible = (card: ClientShowCard) => {
    const currentCards = reactSettings.client_show_cards || DEFAULT_CARDS;

    if (card === 'gateways') {
      return (
        (client?.gateway_tokens?.length ?? 0) > 0 &&
        currentCards.includes(card) &&
        shouldDisplayClientGatewaysAndAutoBill(client)
      );
    }

    return currentCards.includes(card);
  };

  const displayCard = (card: ClientShowCard) => {
    if (!client) return <></>;

    switch (card) {
      case 'details':
        return <Details client={client} />;
      case 'address':
        return <Address client={client} />;
      case 'contacts':
        return <Contacts client={client} />;
      case 'standing':
        return <Standing client={client} />;
      case 'gateways':
        return <Gateways client={client} />;
      case 'public_notes':
        return <ClientPublicNotes client={client} />;
      case 'private_notes':
        return <ClientPrivateNotes client={client} />;
    }
  };

  useEffect(() => {
    setDocumentTitle(client?.display_name || 'view_client');

    return () => {
      setIsPurgeOrMergeActionCalled(false);
    };
  }, [client]);

  const hasSavedCardLayout = Boolean(reactSettings.client_show_cards);

  const currentCards = useMemo(() => {
    return (reactSettings.client_show_cards ||
      DEFAULT_CARDS) as ClientShowCard[];
  }, [reactSettings.client_show_cards]);

  const {
    changeTemplateVisible,
    setChangeTemplateVisible,
    changeTemplateResources,
    changeTemplateEntityContext,
  } = useChangeTemplate();

  useSocketEvent({
    on: 'App\\Events\\Payment\\PaymentWasUpdated',
    callback: () => $refetch(['payments']),
  });

  useSocketEvent({
    on: [
      'App\\Events\\Credit\\CreditWasCreated',
      'App\\Events\\Credit\\CreditWasUpdated',
    ],
    callback: () => $refetch(['credits']),
  });

  return (
    <Default
      title={documentTitle}
      breadcrumbs={pages}
      navigationTopRight={
        client &&
        (hasPermission('edit_client') || entityAssigned(client)) && (
          <ResourceActions
            resource={client}
            actions={actions}
            saveButtonLabel={t('edit')}
            onSaveClick={() => navigate(route('/clients/:id/edit', { id }))}
            cypressRef="clientActionDropdown"
          />
        )
      }
      afterBreadcrumbs={
        <div className="flex flex-1 justify-end items-center gap-2">
          <PreviousNextNavigation entity="client" />

          <CardsCustomizationModal />
        </div>
      }
    >
      {isLoading && (
        <div className="allberto-entity-loading" role="status">
          <Spinner />
          <span className="sr-only">{t('loading')}</span>
        </div>
      )}
      {isError && (
        <div className="allberto-entity-error" role="alert">
          <p>{t('error_title')}</p>
          <Button
            behavior="button"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {t('refresh')}
          </Button>
        </div>
      )}

      {client && (
        <>
          <section className="allberto-entity-detail">
            <div className="allberto-entity-record-meta">
              <EntityStatus entity={client} />
              {client.id_number && (
                <span>
                  {t('id_number')}: {client.id_number}
                </span>
              )}
              {client.number && (
                <span>
                  {t('number')}: {client.number}
                </span>
              )}
            </div>

            {!hasSavedCardLayout && isCardVisible('standing') && (
              <Standing client={client} />
            )}

            <div className="allberto-entity-detail-grid">
              <div className="allberto-entity-detail-main">
                <Tabs tabs={tabs} />
                <div className="allberto-entity-list allberto-entity-related">
                  <Outlet
                    context={{
                      isPurgeOrMergeActionCalled,
                      displayName: client.display_name,
                    }}
                  />
                </div>
              </div>

              <aside
                className="allberto-entity-sidebar"
                aria-label={t('details') as string}
              >
                {currentCards
                  .filter(
                    (card) =>
                      (card !== 'standing' || hasSavedCardLayout) &&
                      isCardVisible(card)
                  )
                  .map((card) => (
                    <Fragment key={card}>{displayCard(card)}</Fragment>
                  ))}
              </aside>
            </div>
          </section>

          <ChangeTemplateModal<IClient>
            entity={changeTemplateEntityContext?.entity ?? 'client'}
            entities={changeTemplateResources as IClient[]}
            visible={changeTemplateVisible}
            setVisible={setChangeTemplateVisible}
            labelFn={(client) => (
              <div className="flex flex-col space-y-1">
                <InputLabel>{t('number')}</InputLabel>

                <span>{client.number}</span>
              </div>
            )}
            bulkUrl={
              changeTemplateEntityContext?.endpoint ?? '/api/v1/clients/bulk'
            }
          />
        </>
      )}
    </Default>
  );
}
