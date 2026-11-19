/**
 * Allberto — estados compartilhados do Painel: carregando, erro com nova
 * tentativa real e vazio. Erro nunca é apresentado como zero.
 */

import { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'react-feather';
import { useTranslation } from 'react-i18next';
import { classifyHttpError } from '../../helpers/allberto-http';

export function Skeleton(props: { width?: string | number; height?: number }) {
  return (
    <span
      className="ab-sk"
      aria-hidden="true"
      style={{ width: props.width ?? '100%', height: props.height ?? 14 }}
    />
  );
}

export function LoadingRows(props: { rows?: number; label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex flex-col gap-3 p-[18px]"
    >
      <span className="sr-only">{props.label}</span>
      {Array.from({ length: props.rows ?? 3 }, (_, index) => (
        <Skeleton key={index} height={18} />
      ))}
    </div>
  );
}

interface ErrorProps {
  error: unknown;
  onRetry: () => void;
  isRetrying?: boolean;
  /** Mensagem quando o servidor não oferece o recurso (404/405). */
  notSupportedMessage?: string;
}

export function ErrorState(props: ErrorProps) {
  const [t] = useTranslation();
  const kind = classifyHttpError(props.error);

  const message =
    kind === 'unsupported'
      ? props.notSupportedMessage || t('allberto_feature_unavailable')
      : kind === 'forbidden'
        ? t('allberto_no_permission')
        : t('allberto_load_error');

  const canRetry = kind !== 'forbidden' && kind !== 'unsupported';

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 p-[18px] text-[13px]"
      style={{ color: 'var(--ab-muted)' }}
    >
      <AlertTriangle
        size={16}
        aria-hidden="true"
        style={{ color: 'var(--ab-danger)' }}
      />
      <span className="flex-1 min-w-[12rem]">{message}</span>
      {canRetry && (
        <button
          type="button"
          className="ab-btn ab-btn--secondary ab-btn--sm"
          onClick={props.onRetry}
          disabled={props.isRetrying}
          aria-busy={props.isRetrying}
        >
          <RefreshCw size={14} aria-hidden="true" />
          {t('allberto_retry')}
        </button>
      )}
    </div>
  );
}

export function EmptyState(props: { children: ReactNode }) {
  return (
    <p className="p-[18px] text-[13px]" style={{ color: 'var(--ab-muted)' }}>
      {props.children}
    </p>
  );
}

interface SectionProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  id: string;
  className?: string;
}

export function DashboardSection(props: SectionProps) {
  return (
    <section
      className={`ab-card overflow-hidden min-w-0 ${props.className ?? ''}`}
      aria-labelledby={props.id}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-[20px] pt-[18px] pb-[14px]">
        <div className="min-w-0">
          <h2 id={props.id} className="ab-h2 flex items-center gap-2">
            {props.title}
          </h2>
          {props.description && (
            <p className="ab-sub mt-1">{props.description}</p>
          )}
        </div>
        {props.action}
      </header>

      {props.children}
    </section>
  );
}
