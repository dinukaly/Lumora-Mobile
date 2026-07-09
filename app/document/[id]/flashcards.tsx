import { useLocalSearchParams, useRouter } from 'expo-router';

import { PlaceholderScreen } from '@/components/ui';

export default function DocumentFlashcardsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PlaceholderScreen
      title={`Flashcards: ${id}`}
      subtitle="This placeholder marks the document-specific review and generation flow."
      badgeLabel="Study"
      highlights={[
        'Flashcards can be reached from both the global tab and the document workspace.',
      ]}
      actions={[
        {
          label: 'Open document quizzes',
          onPress: () =>
            router.push({
              pathname: '/document/[id]/quizzes',
              params: { id },
            }),
        },
        {
          label: 'Back to actions',
          variant: 'secondary',
          onPress: () =>
            router.push({
              pathname: '/document/[id]/actions',
              params: { id },
            }),
        },
      ]}
    />
  );
}
