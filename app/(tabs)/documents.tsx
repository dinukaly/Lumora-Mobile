import { useRouter } from 'expo-router';

import { PlaceholderScreen } from '@/components/ui';

export default function DocumentsScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Documents"
      subtitle="This placeholder will become the upload, filter, refresh, and document-list hub."
      badgeLabel="Tab"
      highlights={[
        'The documents tab lives in the bottom navigator.',
        'Document overview routes open in a separate stack above the tabs.',
      ]}
      actions={[
        {
          label: 'Open sample document overview',
          onPress: () =>
            router.push({
              pathname: '/document/[id]/index',
              params: { id: 'lecture-notes' },
            }),
        },
        {
          label: 'Return to dashboard',
          variant: 'secondary',
          onPress: () => router.push('/(tabs)/dashboard'),
        },
      ]}
    />
  );
}
