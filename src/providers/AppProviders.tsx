import type { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { RealtimeBridge } from '@/realtime/RealtimeBridge';
import { store } from '@/store/store';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <RealtimeBridge>{children}</RealtimeBridge>
    </Provider>
  );
}
