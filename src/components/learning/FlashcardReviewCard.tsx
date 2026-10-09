import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FlashcardItem } from '@/api/flashcardsApi';
import { theme } from '@/theme';

type FlashcardReviewCardProps = {
  flashcard: FlashcardItem;
  revealed: boolean;
  documentTitle?: string;
  onToggleReveal: () => void;
};

export function FlashcardReviewCard({
  flashcard,
  revealed,
  documentTitle,
  onToggleReveal,
}: FlashcardReviewCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={revealed ? 'Hide flashcard answer' : 'Reveal flashcard answer'}
      accessibilityHint="Double tap to flip this flashcard."
      onPress={onToggleReveal}
      style={({ pressed }) => [
        styles.card,
        revealed ? styles.cardBack : styles.cardFront,
        pressed ? styles.cardPressed : null,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{revealed ? 'Answer' : 'Prompt'}</Text>
          {documentTitle ? (
            <Text numberOfLines={1} style={styles.documentTitle}>
              {documentTitle}
            </Text>
          ) : null}
        </View>

        <Text style={styles.body}>{revealed ? flashcard.back : flashcard.front}</Text>

        <Text style={styles.footer}>
          {revealed
            ? 'Choose how well you remembered it to schedule the next review.'
            : 'Tap anywhere on the card to reveal the answer.'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 280,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  cardFront: {
    borderColor: theme.colors.brandStrong,
    backgroundColor: theme.colors.surfaceElevated,
  },
  cardBack: {
    borderColor: theme.colors.info,
    backgroundColor: theme.colors.backgroundMuted,
  },
  cardPressed: {
    opacity: 0.88,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    gap: theme.spacing.xl,
  },
  header: {
    gap: theme.spacing.sm,
  },
  eyebrow: {
    color: theme.colors.brand,
    fontSize: theme.typeScale.eyebrow.fontSize,
    lineHeight: theme.typeScale.eyebrow.lineHeight,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: theme.typeScale.eyebrow.letterSpacing,
  },
  documentTitle: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  body: {
    color: theme.colors.text,
    fontSize: theme.typeScale.heading.fontSize,
    lineHeight: theme.typeScale.heading.lineHeight,
    fontWeight: '700',
  },
  footer: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
});
