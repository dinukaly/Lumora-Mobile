import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useGetDocumentQuery } from '@/api/documentsApi';
import {
  type QuizDifficulty,
  type QuizSubmissionResult,
  useGenerateQuizMutation,
  useGetQuizQuery,
  useListQuizzesQuery,
  useSubmitQuizMutation,
} from '@/api/quizzesApi';
import { QuizQuestionCard, QuizResultsView } from '@/components/learning';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Screen,
  StatusBadge,
  TextField,
} from '@/components/ui';
import { theme } from '@/theme';
import { getApiFormErrorState } from '@/utils/apiErrors';

export default function DocumentQuizzesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const documentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('MEDIUM');
  const [topic, setTopic] = useState('');
  const [answersByQuizId, setAnswersByQuizId] = useState<
    Record<string, Record<number, number>>
  >({});
  const [resultsByQuizId, setResultsByQuizId] = useState<
    Record<string, QuizSubmissionResult | null>
  >({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);

  const {
    data: document,
    error: documentError,
    isLoading: documentLoading,
    isFetching: documentFetching,
    refetch: refetchDocument,
  } = useGetDocumentQuery(documentId ?? '', {
    skip: !documentId,
  });
  const {
    data: quizzesData,
    error: quizzesError,
    isLoading: quizzesLoading,
    isFetching: quizzesFetching,
    refetch: refetchQuizzes,
  } = useListQuizzesQuery(
    documentId
      ? {
          documentId,
        }
      : undefined,
    {
      skip: !documentId,
    },
  );

  const quizzes = quizzesData?.quizzes ?? [];
  const resolvedQuizId = quizzes.some((quiz) => quiz.id === selectedQuizId)
    ? selectedQuizId
    : quizzes[0]?.id ?? null;
  const {
    data: quizDetail,
    error: quizDetailError,
    isLoading: quizDetailLoading,
    isFetching: quizDetailFetching,
    refetch: refetchQuizDetail,
  } = useGetQuizQuery(resolvedQuizId ?? '', {
    skip: !resolvedQuizId,
  });
  const [generateQuiz, { isLoading: isGenerating }] = useGenerateQuizMutation();
  const [submitQuiz, { isLoading: isSubmitting }] = useSubmitQuizMutation();

  const isDocumentReady = document?.status === 'READY';
  const selectedQuiz = quizzes.find((quiz) => quiz.id === resolvedQuizId) ?? null;
  const submittedResult = resolvedQuizId ? resultsByQuizId[resolvedQuizId] ?? null : null;
  const activeAnswers = resolvedQuizId ? answersByQuizId[resolvedQuizId] ?? {} : {};
  const totalQuestions = quizDetail?.questions.length ?? 0;
  const answeredCount =
    quizDetail?.questions.reduce((count, question) => {
      return activeAnswers[question.id] == null ? count : count + 1;
    }, 0) ?? 0;
  const averageScore = quizzes.length
    ? Math.round(
        quizzes.reduce((total, quiz) => {
          if (
            quiz.latestScore == null ||
            quiz.latestTotalQuestions == null ||
            quiz.latestTotalQuestions === 0
          ) {
            return total;
          }

          return total + (quiz.latestScore / quiz.latestTotalQuestions) * 100;
        }, 0) / quizzes.length,
      )
    : 0;
  const isRefreshing =
    documentFetching || quizzesFetching || quizDetailFetching;

  async function handleGenerateQuiz() {
    if (!documentId) {
      return;
    }

    setActionError(null);
    setQueueMessage(null);

    try {
      const result = await generateQuiz({
        documentId,
        questionCount: 8,
        difficulty,
        topic: topic.trim() ? topic.trim() : undefined,
      }).unwrap();

      setQueueMessage(
        `${result.message}. Pull to refresh in a moment or wait for the ready notification.`,
      );
    } catch (error) {
      setActionError(
        getApiFormErrorState(error).formError ??
          'We could not queue quiz generation right now.',
      );
    }
  }

  async function handleSubmitQuiz() {
    if (!resolvedQuizId || !quizDetail) {
      return;
    }

    if (quizDetail.questions.some((question) => activeAnswers[question.id] == null)) {
      setActionError('Select an answer for every question before submitting.');
      return;
    }

    setActionError(null);

    try {
      const orderedAnswers = quizDetail.questions.map(
        (question) => activeAnswers[question.id],
      );
      const result = await submitQuiz({
        quizId: resolvedQuizId,
        answers: orderedAnswers,
      }).unwrap();

      setResultsByQuizId((current: Record<string, QuizSubmissionResult | null>) => ({
        ...current,
        [resolvedQuizId]: result,
      }));
      void refetchQuizzes();
    } catch (error) {
      setActionError(
        getApiFormErrorState(error).formError ??
          'We could not submit this quiz right now.',
      );
    }
  }

  function handleRefresh() {
    setActionError(null);
    void refetchDocument();
    void refetchQuizzes();
    if (resolvedQuizId) {
      void refetchQuizDetail();
    }
  }

  function handleSelectQuiz(quizId: string) {
    setSelectedQuizId(quizId);
    setActionError(null);
  }

  function handleSelectAnswer(questionId: number, optionIndex: number) {
    if (!resolvedQuizId) {
      return;
    }

    setActionError(null);
    setAnswersByQuizId((current: Record<string, Record<number, number>>) => ({
      ...current,
      [resolvedQuizId]: {
        ...(current[resolvedQuizId] ?? {}),
        [questionId]: optionIndex,
      },
    }));
  }

  function handleRetryQuiz() {
    if (!resolvedQuizId) {
      return;
    }

    setActionError(null);
    setAnswersByQuizId((current: Record<string, Record<number, number>>) => ({
      ...current,
      [resolvedQuizId]: {},
    }));
    setResultsByQuizId((current: Record<string, QuizSubmissionResult | null>) => ({
      ...current,
      [resolvedQuizId]: null,
    }));
  }

  if (!documentId) {
    return (
      <Screen
        title="Document quizzes"
        subtitle="We could not identify which document quiz workspace to open."
      >
        <ErrorState
          title="Document unavailable"
          description="Return to your library and open the document again."
          onRetry={() => router.push('/(tabs)/documents')}
          retryLabel="Back to library"
        />
      </Screen>
    );
  }

  if (documentLoading && !document) {
    return (
      <Screen
        title="Document quizzes"
        subtitle="Loading the document and its saved quiz sessions."
      >
        <View style={styles.loadingStack}>
          <Card>
            <View style={styles.loadingLineLarge} />
            <View style={styles.loadingLineMedium} />
            <View style={styles.loadingLineSmall} />
          </Card>
          <Card>
            <View style={styles.loadingCard} />
          </Card>
        </View>
      </Screen>
    );
  }

  if (!document && documentError) {
    return (
      <Screen
        title="Document quizzes"
        subtitle="We could not load this document's quiz workspace."
      >
        <ErrorState
          title="Document unavailable"
          description="We could not load this document right now."
          onRetry={() => void refetchDocument()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title={document?.title ? `Quizzes for ${document.title}` : 'Document quizzes'}
      subtitle="Generate quizzes for one document, answer them, and review scored explanations."
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      headerRight={
        <Button
          size="sm"
          variant="ghost"
          onPress={() =>
            router.push({
              pathname: '/document/[id]',
              params: { id: documentId },
            })
          }
        >
          Overview
        </Button>
      }
    >
      {actionError ? (
        <View style={styles.inlineAlert}>
          <Text style={styles.inlineAlertText}>{actionError}</Text>
        </View>
      ) : null}

      {queueMessage ? (
        <View style={styles.successAlert}>
          <Text style={styles.successAlertText}>{queueMessage}</Text>
        </View>
      ) : null}

      {!isDocumentReady ? (
        <EmptyState
          eyebrow="Processing required"
          title="Quizzes unlock when the document is READY"
          description={
            document?.status === 'FAILED'
              ? document.processingError ||
                'Processing failed, so generation and quiz sessions are unavailable for now.'
              : 'Lumora needs to finish processing this document before it can generate or deliver quizzes.'
          }
          actionLabel="Back to overview"
          onAction={() =>
            router.push({
              pathname: '/document/[id]',
              params: { id: documentId },
            })
          }
        />
      ) : null}

      {document && isDocumentReady ? (
        <>
          <Card
            title="Quiz summary"
            description="Track the available quiz sets and the latest results for this document."
          >
            <View style={styles.documentHeader}>
              <View style={styles.documentHeaderText}>
                <Text style={styles.documentTitle}>{document.title}</Text>
                <Text style={styles.documentSubtitle}>
                  {document.originalFileName}
                </Text>
              </View>
              <StatusBadge label="Ready" tone="READY" />
            </View>

            <View style={styles.metricGrid}>
              <MetricCard
                title="Quizzes"
                value={quizzes.length}
                description="Quiz sets currently available for this document"
              />
              <MetricCard
                title="Questions"
                value={selectedQuiz?.questionCount ?? 0}
                description="Questions in the selected quiz"
              />
              <MetricCard
                title="Average score"
                value={`${averageScore}%`}
                description="Based on the latest saved attempt per quiz"
              />
            </View>
          </Card>

          <Card
            title="Generate quiz"
            description="Queue a new 8-question quiz for this document with optional topic focus and difficulty."
          >
            <View style={styles.generateStack}>
              <TextField
                label="Focus topic"
                placeholder="Optional topic, chapter, or concept"
                value={topic}
                onChangeText={setTopic}
                autoCapitalize="sentences"
                autoCorrect={false}
                hint="Leave blank to generate a quiz across the full document."
              />

              <View style={styles.generateSection}>
                <Text style={styles.sectionTitle}>Difficulty</Text>
                <View style={styles.difficultyChipList}>
                  {(['EASY', 'MEDIUM', 'HARD'] as QuizDifficulty[]).map((value) => (
                    <FilterChip
                      key={value}
                      label={formatDifficultyLabel(value)}
                      selected={difficulty === value}
                      onPress={() => setDifficulty(value)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.generateActions}>
                <Button
                  fullWidth
                  loading={isGenerating}
                  onPress={() => void handleGenerateQuiz()}
                >
                  Generate 8-question quiz
                </Button>
                <Button fullWidth variant="secondary" onPress={handleRefresh}>
                  Refresh quizzes
                </Button>
              </View>
            </View>
          </Card>

          <Card
            title="Quiz list"
            description="Select a quiz for this document and work through the questions."
          >
            {quizzesLoading ? (
              <View style={styles.loadingStack}>
                <View style={styles.loadingLineLarge} />
                <View style={styles.loadingBlock} />
              </View>
            ) : null}

            {!quizzesLoading && quizzesError ? (
              <ErrorState
                title="Quizzes unavailable"
                description="We could not load this document's quiz list right now."
                onRetry={handleRefresh}
              />
            ) : null}

            {!quizzesLoading && !quizzesError && !quizzes.length ? (
              <EmptyState
                eyebrow="No quizzes yet"
                title="No quizzes are ready for this document"
                description="Generate the first quiz to start practicing this material."
                actionLabel="Generate quiz"
                onAction={() => void handleGenerateQuiz()}
              />
            ) : null}

            {!quizzesLoading && !quizzesError && quizzes.length ? (
              <View style={styles.quizList}>
                {quizzes.map((quiz) => {
                  const selected = quiz.id === resolvedQuizId;

                  return (
                    <Pressable
                      key={quiz.id}
                      accessibilityRole="button"
                      onPress={() => handleSelectQuiz(quiz.id)}
                      style={({ pressed }) => [
                        styles.quizListItem,
                        selected ? styles.quizListItemSelected : null,
                        pressed ? styles.quizListItemPressed : null,
                      ]}
                    >
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.quizListTitle,
                          selected ? styles.quizListTitleSelected : null,
                        ]}
                      >
                        {quiz.title}
                      </Text>
                      <View style={styles.quizListMetaRow}>
                        <Text style={styles.quizListMetaText}>
                          {quiz.questionCount} questions
                        </Text>
                        <Text style={styles.quizListMetaText}>
                          {formatRelativeDate(quiz.createdAt)}
                        </Text>
                      </View>
                      {quiz.latestScore != null && quiz.latestTotalQuestions != null ? (
                        <Text style={styles.quizListScore}>
                          Latest score: {quiz.latestScore}/{quiz.latestTotalQuestions}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </Card>

          <Card
            title={selectedQuiz?.title ?? 'Quiz session'}
            description={
              submittedResult
                ? 'Review the results and explanations from your latest submitted attempt.'
                : 'Answer each question, then submit to see a scored result.'
            }
          >
            {quizDetailLoading && !quizDetail ? (
              <View style={styles.loadingStack}>
                <View style={styles.loadingLineLarge} />
                <View style={styles.loadingCard} />
              </View>
            ) : null}

            {!quizDetailLoading && quizDetailError ? (
              <ErrorState
                title="Quiz unavailable"
                description="We could not load this quiz right now."
                onRetry={() => void refetchQuizDetail()}
              />
            ) : null}

            {!quizDetailLoading && !quizDetailError && !quizDetail ? (
              <EmptyState
                eyebrow="Nothing selected"
                title="Pick a quiz to begin"
                description="Select a quiz from the list above to answer questions and review explanations."
              />
            ) : null}

            {quizDetail && submittedResult ? (
              <QuizResultsView
                quizTitle={quizDetail.title}
                questions={quizDetail.questions}
                result={submittedResult}
                onRetry={handleRetryQuiz}
              />
            ) : null}

            {quizDetail && !submittedResult ? (
              <View style={styles.sessionStack}>
                <View style={styles.sessionSummary}>
                  <Text style={styles.sessionSummaryText}>
                    {answeredCount} of {totalQuestions} answered
                  </Text>
                  <Text style={styles.sessionSummaryText}>
                    {selectedQuiz?.questionCount ?? totalQuestions} questions
                  </Text>
                </View>

                <View style={styles.questionList}>
                  {quizDetail.questions.map((question, index) => (
                    <QuizQuestionCard
                      key={question.id}
                      question={question}
                      questionNumber={index + 1}
                      selectedOption={activeAnswers[question.id]}
                      onSelectOption={(optionIndex) =>
                        handleSelectAnswer(question.id, optionIndex)
                      }
                    />
                  ))}
                </View>

                <View style={styles.submitRow}>
                  <Text style={styles.mutedText}>
                    Submit once every question has an answer.
                  </Text>
                  <Button
                    loading={isSubmitting}
                    disabled={totalQuestions === 0}
                    onPress={() => void handleSubmitQuiz()}
                  >
                    Submit quiz
                  </Button>
                </View>
              </View>
            ) : null}
          </Card>

          <Card
            title="Next study step"
            description="Continue from quizzes into adjacent study tools for this same document."
          >
            <View style={styles.nextStepActions}>
              <Button
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/document/[id]/actions',
                    params: { id: documentId },
                  })
                }
              >
                Back to AI actions
              </Button>
              <Button
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/document/[id]/flashcards',
                    params: { id: documentId },
                  })
                }
              >
                Open flashcards
              </Button>
            </View>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number | string;
  description: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDescription}>{description}</Text>
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        selected ? styles.filterChipSelected : null,
        pressed ? styles.filterChipPressed : null,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.filterChipText,
          selected ? styles.filterChipTextSelected : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function formatDifficultyLabel(value: QuizDifficulty) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function formatRelativeDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  inlineAlert: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: theme.colors.dangerSoft,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  inlineAlertText: {
    color: '#7F1D1D',
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  successAlert: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: '#86EFAC',
    backgroundColor: theme.colors.successSoft,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  successAlertText: {
    color: '#166534',
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  loadingStack: {
    gap: theme.spacing.md,
  },
  loadingLineLarge: {
    width: '76%',
    height: 16,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  loadingLineMedium: {
    width: '92%',
    height: 14,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  loadingLineSmall: {
    width: '54%',
    height: 14,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  loadingBlock: {
    width: '100%',
    height: 140,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceSoft,
  },
  loadingCard: {
    width: '100%',
    height: 220,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surfaceSoft,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  documentHeaderText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  documentTitle: {
    color: theme.colors.text,
    fontSize: theme.typeScale.title.fontSize,
    lineHeight: theme.typeScale.title.lineHeight,
    fontWeight: '700',
  },
  documentSubtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  metricGrid: {
    gap: theme.spacing.md,
  },
  metricCard: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  metricLabel: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  metricDescription: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  generateStack: {
    gap: theme.spacing.lg,
  },
  generateSection: {
    gap: theme.spacing.md,
  },
  difficultyChipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  filterChip: {
    maxWidth: '100%',
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    minHeight: 40,
    justifyContent: 'center',
  },
  filterChipSelected: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.brandSoft,
  },
  filterChipPressed: {
    opacity: 0.88,
  },
  filterChipText: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: '#053B32',
  },
  generateActions: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typeScale.label.fontSize,
    lineHeight: theme.typeScale.label.lineHeight,
    fontWeight: '700',
  },
  quizList: {
    gap: theme.spacing.md,
  },
  quizListItem: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  quizListItemSelected: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.backgroundMuted,
  },
  quizListItemPressed: {
    opacity: 0.88,
  },
  quizListTitle: {
    color: theme.colors.text,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
    fontWeight: '700',
  },
  quizListTitleSelected: {
    color: theme.colors.brandSoft,
  },
  quizListMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  quizListMetaText: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  quizListScore: {
    color: theme.colors.brand,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    fontWeight: '600',
  },
  sessionStack: {
    gap: theme.spacing.lg,
  },
  sessionSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  sessionSummaryText: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    fontWeight: '600',
  },
  questionList: {
    gap: theme.spacing.md,
  },
  submitRow: {
    gap: theme.spacing.md,
  },
  mutedText: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  nextStepActions: {
    gap: theme.spacing.md,
  },
});
