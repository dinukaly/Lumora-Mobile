import { useRouter } from 'expo-router';

import { Button, Card, PlaceholderScreen } from '@/components/ui';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Welcome back to Lumora."
      subtitle="This placeholder login screen sits inside the auth stack and gives us a clean entry point for the real form."
      badgeLabel="Auth"
      highlights={[
        'The app can enter the dedicated auth route group.',
        'Users can move between login and register placeholders.',
        'The flow can jump into the tab navigator for app-shell testing.',
      ]}
      actions={[
        {
          label: 'Open register screen',
          variant: 'secondary',
          onPress: () => router.push('/(auth)/register'),
        },
        {
          label: 'Enter app shell',
          onPress: () => router.replace('/(tabs)/dashboard'),
        },
      ]}
      footer={
        <Card title="Implementation note" description="Real validation and mobile token handling will land in the auth phase.">
          <Button variant="ghost" onPress={() => router.push('/notifications')}>
            Preview notifications route
          </Button>
        </Card>
      }
    />
  );
}
