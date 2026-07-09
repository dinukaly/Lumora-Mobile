import { useRouter } from 'expo-router';

import { Button, Card, PlaceholderScreen } from '@/components/ui';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Dashboard"
      subtitle="This placeholder stands in for progress cards, recent activity, and quick actions."
      badgeLabel="Tab"
      highlights={[
        'The bottom-tab shell is mounted and reachable from auth.',
        'Notifications can sit above the tabs as a separate screen.',
        'Document-scoped routes can open from main-app screens.',
      ]}
      actions={[
        {
          label: 'Open notifications',
          variant: 'secondary',
          onPress: () => router.push('/notifications'),
        },
        {
          label: 'Open sample document',
          onPress: () =>
            router.push({
              pathname: '/document/[id]/index',
              params: { id: 'demo-doc' },
            }),
        },
      ]}
      footer={
        <Card title="Quick path checks">
          <Button variant="ghost" onPress={() => router.push('/(tabs)/documents')}>
            Go to documents tab
          </Button>
        </Card>
      }
    />
  );
}
