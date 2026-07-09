import { useLocalSearchParams, useRouter } from 'expo-router';

import { PlaceholderScreen } from '@/components/ui';

export default function DocumentChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PlaceholderScreen
      title={`Ask AI: ${id}`}
      subtitle="This placeholder represents the document-grounded conversation view."
      badgeLabel="Chat"
      highlights={[
        'Chat lives inside the document stack.',
        'The route can move back to reading or into saved AI actions.',
      ]}
      actions={[
        {
          label: 'Back to PDF',
          variant: 'secondary',
          onPress: () =>
            router.push({
              pathname: '/document/[id]/pdf',
              params: { id },
            }),
        },
        {
          label: 'Open AI actions',
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
