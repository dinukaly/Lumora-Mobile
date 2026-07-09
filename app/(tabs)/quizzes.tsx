import { useRouter } from 'expo-router';

import { PlaceholderScreen } from '@/components/ui';

export default function QuizzesScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Quizzes"
      subtitle="This placeholder marks the global quiz list and quiz-session entry point."
      badgeLabel="Tab"
      highlights={[
        'Quizzes sit in the bottom tabs beside documents and flashcards.',
        'Document-specific quizzes can still open in the document stack.',
      ]}
      actions={[
        {
          label: 'Open document quizzes',
          onPress: () =>
            router.push({
              pathname: '/document/[id]/quizzes',
              params: { id: 'lecture-notes' },
            }),
        },
      ]}
    />
  );
}
