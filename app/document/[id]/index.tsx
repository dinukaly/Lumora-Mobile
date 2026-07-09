import { useLocalSearchParams, useRouter } from 'expo-router';

import { PlaceholderScreen } from '@/components/ui';

export default function DocumentOverviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PlaceholderScreen
      title={`Document: ${id}`}
      subtitle="This placeholder overview anchors the document stack above the tab navigator."
      badgeLabel="Document"
      highlights={[
        'Document overview is separate from the bottom-tab navigator.',
        'Child routes can handle PDF reading, chat, AI actions, flashcards, and quizzes.',
      ]}
      actions={[
        {
          label: 'Open PDF screen',
          onPress: () =>
            router.push({
              pathname: '/document/[id]/pdf',
              params: { id },
            }),
        },
        {
          label: 'Open AI chat',
          variant: 'secondary',
          onPress: () =>
            router.push({
              pathname: '/document/[id]/chat',
              params: { id },
            }),
        },
        {
          label: 'Open AI actions',
          variant: 'secondary',
          onPress: () =>
            router.push({
              pathname: '/document/[id]/actions',
              params: { id },
            }),
        },
        {
          label: 'Back to documents tab',
          variant: 'ghost',
          onPress: () => router.push('/(tabs)/documents'),
        },
      ]}
    />
  );
}
