import { useFormatMoney } from '$app/common/hooks/money/useFormatMoney';
import {
  MASKED_VALUE,
  useHideValues,
} from '$app/components/layouts/common/privacy';

/** formatMoney do Ninja com a máscara "ocultar valores" do Painel. */
export function useDashboardFormatMoney() {
  const formatMoney = useFormatMoney();
  const hidden = useHideValues();

  return (...args: Parameters<ReturnType<typeof useFormatMoney>>) =>
    hidden ? MASKED_VALUE : formatMoney(...args);
}
