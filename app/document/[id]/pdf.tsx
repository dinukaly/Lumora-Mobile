import { useLocalSearchParams, useRouter } from 'expo-router';

import { PlaceholderScreen } from '@/components/ui';

export default function DocumentPdfScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PlaceholderScreen
      title={`PDF Reader: ${id}`}
      subtitle="This placeholder reserves the full-screen protected PDF viewer flow."
      badgeLabel="Read"
      highlights={[
        'PDF viewing is document-scoped, not a tab.',
        'The route can return to overview or move into AI chat.',
      ]}
      actions={[
        {
          label: 'Back to overview',
          variant: 'secondary',
          onPress: () =>
            router.push({
              pathname: '/document/[id]/index',
              params: { id },
            }),
        },
        {
          label: 'Open chat',
          onPress: () =>
            router.push({
              pathname: '/document/[id]/chat',
              params: { id },
            }),
        },
      ]}
    />
  );
}
