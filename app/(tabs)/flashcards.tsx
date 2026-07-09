import { useRouter } from 'expo-router';

import { PlaceholderScreen } from '@/components/ui';

export default function FlashcardsScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Flashcards"
      subtitle="This placeholder reserves the global due-card review flow in the tab bar."
      badgeLabel="Tab"
      highlights={[
        'Flashcards appear as a first-class bottom-tab destination.',
        'The screen can drill into document-scoped study routes later.',
      ]}
      actions={[
        {
          label: 'Open document flashcards',
          onPress: () =>
            router.push({
              pathname: '/document/[id]/flashcards',
              params: { id: 'lecture-notes' },
            }),
        },
      ]}
    />
  );
}
