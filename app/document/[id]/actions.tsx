import { useLocalSearchParams, useRouter } from 'expo-router';

import { PlaceholderScreen } from '@/components/ui';

export default function DocumentActionsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PlaceholderScreen
      title={`AI Actions: ${id}`}
      subtitle="This placeholder reserves summary, concepts, and takeaways generated for a document."
      badgeLabel="Actions"
      highlights={[
        'AI actions are grouped under the document stack.',
        'The route can branch into flashcards and quizzes for learning workflows.',
      ]}
      actions={[
        {
          label: 'Open document flashcards',
          onPress: () =>
            router.push({
              pathname: '/document/[id]/flashcards',
              params: { id },
            }),
        },
        {
          label: 'Open document quizzes',
          variant: 'secondary',
          onPress: () =>
            router.push({
              pathname: '/document/[id]/quizzes',
              params: { id },
            }),
        },
      ]}
    />
  );
}
