import { useLocalSearchParams, useRouter } from 'expo-router';

import { PlaceholderScreen } from '@/components/ui';

export default function DocumentQuizzesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PlaceholderScreen
      title={`Quizzes: ${id}`}
      subtitle="This placeholder reserves document-scoped quiz generation and quiz sessions."
      badgeLabel="Quiz"
      highlights={[
        'Quizzes can be global or document-specific without breaking the route hierarchy.',
      ]}
      actions={[
        {
          label: 'Back to actions',
          variant: 'secondary',
          onPress: () =>
            router.push({
              pathname: '/document/[id]/actions',
              params: { id },
            }),
        },
        {
          label: 'Return to quizzes tab',
          onPress: () => router.push('/(tabs)/quizzes'),
        },
      ]}
    />
  );
}
