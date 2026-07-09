import { useRouter } from 'expo-router';

import { PlaceholderScreen } from '@/components/ui';

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Create your Lumora account."
      subtitle="This register placeholder confirms the auth stack is wired separately from the main tab experience."
      badgeLabel="Auth"
      highlights={[
        'Registration lives alongside login inside the auth stack.',
        'The route can move back to login without crossing into tabs.',
      ]}
      actions={[
        {
          label: 'Back to login',
          variant: 'secondary',
          onPress: () => router.push('/(auth)/login'),
        },
        {
          label: 'Enter app shell',
          onPress: () => router.replace('/(tabs)/dashboard'),
        },
      ]}
    />
  );
}
