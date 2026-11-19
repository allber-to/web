/** Replace entrypoint side effects only; production components/hooks stay real. */
import mitt from 'mitt';
import { atom } from 'jotai';
import type { Events } from '../../src/common/events';
export const emitter = mitt<Events>();
export const refreshEntityDataBannerAtom = atom({
  visible: false,
  refetchEntity: 'recurring_invoices',
  refetchEntityId: '',
});
