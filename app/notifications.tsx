import { useRouter } from 'expo-router';

import { PlaceholderScreen } from '@/components/ui';

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Notifications"
      subtitle="This route sits outside the tab group so it can be opened from dashboard headers and profile settings."
      badgeLabel="Inbox"
      highlights={[
        'Notifications are configured as a standalone screen above the tabs.',
        'The route can link back into document-specific stacks.',
      ]}
      actions={[
        {
          label: 'Open sample document overview',
          onPress: () =>
            router.push({
              pathname: '/document/[id]',
              params: { id: 'lecture-notes' },
            }),
        },
        {
          label: 'Back to dashboard',
          variant: 'secondary',
          onPress: () => router.push('/(tabs)/dashboard'),
        },
      ]}
    />
  );
}
