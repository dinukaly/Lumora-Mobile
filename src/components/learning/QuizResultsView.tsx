import { StyleSheet, Text, View } from 'react-native';

import type { QuizQuestion, QuizSubmissionResult } from '@/api/quizzesApi';
import { Button } from '@/components/ui';
import { theme } from '@/theme';

type QuizResultsViewProps = {
  quizTitle: string;
  questions: QuizQuestion[];
  result: QuizSubmissionResult;
  onRetry: () => void;
};

export function QuizResultsView({
  quizTitle,
  questions,
  result,
  onRetry,
}: QuizResultsViewProps) {
  const percentage = result.totalQuestions
    ? Math.round((result.score / result.totalQuestions) * 100)
    : 0;

  return (
    <View style={styles.stack}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryText}>
          <Text style={styles.summaryEyebrow}>Latest result</Text>
          <Text style={styles.summaryTitle}>{quizTitle}</Text>
          <Text style={styles.summaryBody}>
            You scored {result.score} out of {result.totalQuestions} questions correctly.
          </Text>
        </View>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreValue}>{percentage}%</Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>
      </View>

      <View style={styles.resultList}>
        {result.results.map((questionResult) => {
          const question = questions[questionResult.questionIndex];
          const isCorrect = questionResult.selected === questionResult.correct;
          const selectedLabel =
            question?.options[questionResult.selected] ?? 'No answer';
          const correctLabel =
            question?.options[questionResult.correct] ?? 'Unknown';

          return (
            <View
              key={questionResult.questionIndex}
              style={[
                styles.resultCard,
                isCorrect ? styles.resultCardCorrect : styles.resultCardIncorrect,
              ]}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultEyebrow}>
                  Question {questionResult.questionIndex + 1}
                </Text>
                <Text style={styles.resultQuestion}>{question?.question ?? 'Question'}</Text>
              </View>

              <View
                style={[
                  styles.resultBanner,
                  isCorrect ? styles.resultBannerCorrect : styles.resultBannerIncorrect,
                ]}
              >
                <Text
                  style={[
                    styles.resultBannerTitle,
                    isCorrect ? styles.resultBannerTitleCorrect : styles.resultBannerTitleIncorrect,
                  ]}
                >
                  {isCorrect ? 'Correct' : 'Needs review'}
                </Text>
                <Text
                  style={[
                    styles.resultBannerText,
                    isCorrect ? styles.resultBannerTextCorrect : styles.resultBannerTextIncorrect,
                  ]}
                >
                  Your answer: {selectedLabel}
                </Text>
                {!isCorrect ? (
                  <Text style={[styles.resultBannerText, styles.resultBannerTextIncorrect]}>
                    Correct answer: {correctLabel}
                  </Text>
                ) : null}
              </View>

              {questionResult.explanation ? (
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationTitle}>Explanation</Text>
                  <Text style={styles.explanationText}>
                    {questionResult.explanation}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.retryRow}>
        <Button variant="secondary" onPress={onRetry}>
          Retake quiz
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: theme.spacing.lg,
  },
  summaryCard: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: '#86EFAC',
    backgroundColor: theme.colors.successSoft,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  summaryText: {
    gap: theme.spacing.sm,
  },
  summaryEyebrow: {
    color: '#047857',
    fontSize: theme.typeScale.eyebrow.fontSize,
    lineHeight: theme.typeScale.eyebrow.lineHeight,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: theme.typeScale.eyebrow.letterSpacing,
  },
  summaryTitle: {
    color: '#052E2B',
    fontSize: theme.typeScale.heading.fontSize,
    lineHeight: theme.typeScale.heading.lineHeight,
    fontWeight: '700',
  },
  summaryBody: {
    color: '#166534',
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  scoreCard: {
    alignSelf: 'flex-start',
    borderRadius: theme.radii.md,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minWidth: 96,
    gap: 2,
  },
  scoreValue: {
    color: '#047857',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreLabel: {
    color: theme.colors.textSoft,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  resultList: {
    gap: theme.spacing.md,
  },
  resultCard: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  resultCardCorrect: {
    borderColor: '#86EFAC',
  },
  resultCardIncorrect: {
    borderColor: '#FCA5A5',
  },
  resultHeader: {
    gap: theme.spacing.xs,
  },
  resultEyebrow: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  resultQuestion: {
    color: theme.colors.text,
    fontSize: theme.typeScale.title.fontSize,
    lineHeight: theme.typeScale.title.lineHeight,
    fontWeight: '700',
  },
  resultBanner: {
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  resultBannerCorrect: {
    backgroundColor: theme.colors.successSoft,
  },
  resultBannerIncorrect: {
    backgroundColor: theme.colors.dangerSoft,
  },
  resultBannerTitle: {
    fontSize: theme.typeScale.label.fontSize,
    lineHeight: theme.typeScale.label.lineHeight,
    fontWeight: '700',
  },
  resultBannerTitleCorrect: {
    color: '#047857',
  },
  resultBannerTitleIncorrect: {
    color: '#B91C1C',
  },
  resultBannerText: {
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  resultBannerTextCorrect: {
    color: '#166534',
  },
  resultBannerTextIncorrect: {
    color: '#7F1D1D',
  },
  explanationBox: {
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  explanationTitle: {
    color: theme.colors.text,
    fontSize: theme.typeScale.label.fontSize,
    lineHeight: theme.typeScale.label.lineHeight,
    fontWeight: '700',
  },
  explanationText: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  retryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
