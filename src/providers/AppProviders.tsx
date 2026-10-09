import type { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { PushNotificationsBridge } from '@/notifications/PushNotificationsBridge';
import { RealtimeBridge } from '@/realtime/RealtimeBridge';
import { store } from '@/store/store';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <RealtimeBridge>
        <PushNotificationsBridge>{children}</PushNotificationsBridge>
      </RealtimeBridge>
    </Provider>
  );
}
