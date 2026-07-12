import { StyleSheet, Text, View } from 'react-native';

import type { ConversationMessage } from '@/api/conversationsApi';
import { theme } from '@/theme';

import { CitationCard } from './CitationCard';

type ChatMessageBubbleProps = {
  message: ConversationMessage;
  pending?: boolean;
};

export function ChatMessageBubble({
  message,
  pending = false,
}: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View
      style={[
        styles.wrapper,
        isUser ? styles.userWrapper : styles.assistantWrapper,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          pending ? styles.pendingBubble : null,
        ]}
      >
        <Text style={isUser ? styles.userText : styles.assistantText}>
          {message.content}
        </Text>
      </View>

      {!isUser && message.citations?.length ? (
        <View style={styles.citationList}>
          {message.citations.map((citation, index) => (
            <CitationCard
              key={`${message.id}-citation-${index}`}
              citation={citation}
            />
          ))}
        </View>
      ) : null}

      <Text style={styles.timestamp}>
        {pending ? 'Sending...' : formatChatTimestamp(message.createdAt)}
      </Text>
    </View>
  );
}

function formatChatTimestamp(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.sm,
  },
  userWrapper: {
    alignItems: 'flex-end',
  },
  assistantWrapper: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  userBubble: {
    backgroundColor: theme.colors.brand,
  },
  assistantBubble: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pendingBubble: {
    opacity: 0.72,
  },
  userText: {
    color: '#04211D',
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  assistantText: {
    color: theme.colors.text,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  citationList: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  timestamp: {
    color: theme.colors.textSoft,
    fontSize: 12,
    lineHeight: 16,
  },
});
