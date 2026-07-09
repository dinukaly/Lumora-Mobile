import { useRouter } from 'expo-router';

import { PlaceholderScreen } from '@/components/ui';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Profile"
      subtitle="This placeholder reserves user info, settings, and logout actions."
      badgeLabel="Tab"
      highlights={[
        'Profile is included as the fifth bottom tab.',
        'The app can still jump back to auth when logout is implemented.',
      ]}
      actions={[
        {
          label: 'Preview login route',
          variant: 'secondary',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]}
    />
  );
}
