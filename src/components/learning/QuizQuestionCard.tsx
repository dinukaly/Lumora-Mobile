import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { QuizQuestion } from '@/api/quizzesApi';
import { theme } from '@/theme';

type QuizQuestionCardProps = {
  question: QuizQuestion;
  questionNumber: number;
  selectedOption?: number;
  onSelectOption: (optionIndex: number) => void;
};

export function QuizQuestionCard({
  question,
  questionNumber,
  selectedOption,
  onSelectOption,
}: QuizQuestionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Question {questionNumber}</Text>
        <Text style={styles.questionText}>{question.question}</Text>
      </View>

      <View style={styles.optionsList}>
        {question.options.map((option, optionIndex) => {
          const isSelected = selectedOption === optionIndex;

          return (
            <Pressable
              key={`${question.id}-${optionIndex}`}
              accessibilityRole="button"
              onPress={() => onSelectOption(optionIndex)}
              style={({ pressed }) => [
                styles.optionButton,
                isSelected ? styles.optionButtonSelected : null,
                pressed ? styles.optionButtonPressed : null,
              ]}
            >
              <View
                style={[
                  styles.optionBadge,
                  isSelected ? styles.optionBadgeSelected : null,
                ]}
              >
                <Text
                  style={[
                    styles.optionBadgeText,
                    isSelected ? styles.optionBadgeTextSelected : null,
                  ]}
                >
                  {String.fromCharCode(65 + optionIndex)}
                </Text>
              </View>
              <Text
                style={[
                  styles.optionText,
                  isSelected ? styles.optionTextSelected : null,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.sm,
  },
  eyebrow: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  questionText: {
    color: theme.colors.text,
    fontSize: theme.typeScale.title.fontSize,
    lineHeight: theme.typeScale.title.lineHeight,
    fontWeight: '700',
  },
  optionsList: {
    gap: theme.spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  optionButtonSelected: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.backgroundMuted,
  },
  optionButtonPressed: {
    opacity: 0.88,
  },
  optionBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  optionBadgeSelected: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.brand,
  },
  optionBadgeText: {
    color: theme.colors.textSoft,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  optionBadgeTextSelected: {
    color: '#04211D',
  },
  optionText: {
    flex: 1,
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  optionTextSelected: {
    color: theme.colors.text,
  },
});
