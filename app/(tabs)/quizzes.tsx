import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  type DocumentData,
  useListDocumentsQuery,
} from '@/api/documentsApi';
import {
  useGetQuizQuery,
  useListQuizzesQuery,
  useSubmitQuizMutation,
  type QuizSubmissionResult,
} from '@/api/quizzesApi';
import { QuizQuestionCard, QuizResultsView } from '@/components/learning';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  InlineNotice,
  Screen,
  StatusBadge,
} from '@/components/ui';
import { theme } from '@/theme';
import { getApiFormErrorState } from '@/utils/apiErrors';

const DOCUMENT_PAGE_SIZE = 100;

const STATUS_LABELS: Record<DocumentData['status'], string> = {
  UPLOADED: 'Uploaded',
  PROCESSING: 'Processing',
  READY: 'Ready',
  FAILED: 'Failed',
};

export default function QuizzesScreen() {
  const router = useRouter();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>();
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [answersByQuizId, setAnswersByQuizId] = useState<
    Record<string, Record<number, number>>
  >({});
  const [resultsByQuizId, setResultsByQuizId] = useState<
    Record<string, QuizSubmissionResult | null>
  >({});
  const [quizError, setQuizError] = useState<string | null>(null);

  const {
    data: documentsData,
    error: documentsError,
    isLoading: documentsLoading,
    isFetching: documentsFetching,
    refetch: refetchDocuments,
  } = useListDocumentsQuery({
    page: 1,
    limit: DOCUMENT_PAGE_SIZE,
  });
  const {
    data: quizzesData,
    error: quizzesError,
    isLoading: quizzesLoading,
    isFetching: quizzesFetching,
    refetch: refetchQuizzes,
  } = useListQuizzesQuery({
    documentId: selectedDocumentId,
  });

  const documents = documentsData?.documents ?? [];
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
  const [submitQuiz, { isLoading: isSubmitting }] = useSubmitQuizMutation();

  const selectedDocument =
    documents.find((document) => document._id === selectedDocumentId) ?? null;
  const selectedQuiz = quizzes.find((quiz) => quiz.id === resolvedQuizId) ?? null;
  const activeAnswers = resolvedQuizId ? answersByQuizId[resolvedQuizId] ?? {} : {};
  const submittedResult = resolvedQuizId ? resultsByQuizId[resolvedQuizId] ?? null : null;
  const totalQuestions = quizDetail?.questions.length ?? 0;
  const answeredCount = quizDetail?.questions.reduce((count, question) => {
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
  const isRefreshing = documentsFetching || quizzesFetching || quizDetailFetching;

  function handleRefresh() {
    setQuizError(null);
    void refetchDocuments();
    void refetchQuizzes();
    if (resolvedQuizId) {
      void refetchQuizDetail();
    }
  }

  async function handleSubmitQuiz() {
    if (!resolvedQuizId || !quizDetail) {
      return;
    }

    if (quizDetail.questions.some((question) => activeAnswers[question.id] == null)) {
      setQuizError('Select an answer for every question before submitting.');
      return;
    }

    setQuizError(null);

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
      const parsedError = getApiFormErrorState(error).formError;
      setQuizError(parsedError ?? 'We could not submit this quiz right now.');
    }
  }

  function handleSelectQuiz(quizId: string) {
    setSelectedQuizId(quizId);
    setQuizError(null);
  }

  function handleSelectAnswer(questionId: number, optionIndex: number) {
    if (!resolvedQuizId) {
      return;
    }

    setQuizError(null);
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

    setQuizError(null);
    setAnswersByQuizId((current: Record<string, Record<number, number>>) => ({
      ...current,
      [resolvedQuizId]: {},
    }));
    setResultsByQuizId((current: Record<string, QuizSubmissionResult | null>) => ({
      ...current,
      [resolvedQuizId]: null,
    }));
  }

  return (
    <Screen
      title="Quizzes"
      subtitle="Review available quizzes across your documents and submit scored attempts."
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      headerRight={
        selectedDocument ? (
          <Button
            size="sm"
            variant="ghost"
            onPress={() =>
              router.push({
                pathname: '/document/[id]/quizzes',
                params: { id: selectedDocument._id },
              })
            }
          >
            Document
          </Button>
        ) : undefined
      }
    >
      {quizError ? (
        <View style={styles.inlineAlert}>
          <Text style={styles.inlineAlertText}>{quizError}</Text>
        </View>
      ) : null}

      {documentsError && documents.length > 0 ? (
        <InlineNotice message="Document filters are showing cached data. Pull to refresh and try again." />
      ) : null}

      {quizzesError && quizzes.length > 0 ? (
        <InlineNotice message="The quiz list is showing cached data. Pull to refresh and try again." />
      ) : null}

      {quizDetailError && quizDetail ? (
        <InlineNotice message="The selected quiz is showing cached details. Pull to refresh and try again." />
      ) : null}

      <Card
        title="Filters"
        description="Browse quizzes from every document or narrow the list to one document."
      >
        {documentsLoading && !documents.length ? (
          <Text style={styles.mutedText}>Loading document filters...</Text>
        ) : null}

        <View style={styles.filterChipList}>
          <FilterChip
            label="All documents"
            selected={!selectedDocumentId}
            onPress={() => setSelectedDocumentId(undefined)}
          />
          {documents.map((document) => (
            <FilterChip
              key={document._id}
              label={document.title}
              selected={document._id === selectedDocumentId}
              onPress={() => setSelectedDocumentId(document._id)}
            />
          ))}
        </View>

        {documentsError && !documents.length ? (
          <Text style={styles.warningText}>
            Document filters are unavailable right now, but quiz sessions can still load.
          </Text>
        ) : null}
      </Card>

      <View style={styles.metricGrid}>
        <MetricCard
          title="Quizzes"
          value={quizzes.length}
          description="Quiz sets available in this scope"
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

      {selectedDocument && selectedDocument.status !== 'READY' ? (
        <EmptyState
          eyebrow="Document locked"
          title="This document is not ready for new quiz generation"
          description={
            selectedDocument.status === 'PROCESSING'
              ? 'Processing is still underway. Existing quizzes may remain visible, but new document-specific quiz work should wait until READY.'
              : selectedDocument.status === 'FAILED'
                ? selectedDocument.processingError ||
                  'Processing failed, so this document needs attention before further study actions.'
                : 'This document will unlock quiz generation once processing reaches READY.'
          }
          actionLabel="Open overview"
          onAction={() =>
            router.push({
              pathname: '/document/[id]',
              params: { id: selectedDocument._id },
            })
          }
        />
      ) : null}

      <Card
        title="Quiz list"
        description="Select a quiz to answer its questions and review the scored result."
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
            description="We could not load the quiz list right now."
            onRetry={handleRefresh}
          />
        ) : null}

        {!quizzesLoading && !quizzesError && !quizzes.length ? (
          <EmptyState
            eyebrow="No quizzes yet"
            title="No quizzes are available in this scope"
            description={
              selectedDocument
                ? 'Open the document-specific quizzes screen to generate the first quiz for this material.'
                : 'Choose a document to focus the list, or open a document workspace to generate a new quiz.'
            }
            actionLabel={selectedDocument ? 'Open document quizzes' : 'Go to documents'}
            onAction={() =>
              selectedDocument
                ? router.push({
                    pathname: '/document/[id]/quizzes',
                    params: { id: selectedDocument._id },
                  })
                : router.push('/(tabs)/documents')
            }
          />
        ) : null}

        {!quizzesLoading && !quizzesError && quizzes.length ? (
          <View style={styles.quizList}>
            {quizzes.map((quiz) => (
              <Pressable
                key={quiz.id}
                accessibilityRole="button"
                onPress={() => handleSelectQuiz(quiz.id)}
                style={({ pressed }) => [
                  styles.quizListItem,
                  quiz.id === resolvedQuizId ? styles.quizListItemSelected : null,
                  pressed ? styles.quizListItemPressed : null,
                ]}
              >
                <Text
                  numberOfLines={2}
                  style={[
                    styles.quizListTitle,
                    quiz.id === resolvedQuizId ? styles.quizListTitleSelected : null,
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
            ))}
          </View>
        ) : null}
      </Card>

      <Card
        title={selectedQuiz?.title ?? 'Quiz session'}
        description={
          submittedResult
            ? 'Review the results and explanations from the latest submitted attempt.'
            : 'Answer each question, then submit to see your scored result.'
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

      {selectedDocument ? (
        <Card
          title="Source document"
          description="Open the matching document workspace when you want to continue studying in context."
        >
          <View style={styles.sourceDocumentCard}>
            <View style={styles.sourceDocumentHeader}>
              <View style={styles.sourceDocumentText}>
                <Text style={styles.sourceDocumentTitle}>
                  {selectedDocument.title}
                </Text>
                <Text style={styles.sourceDocumentSubtitle}>
                  {selectedDocument.originalFileName}
                </Text>
              </View>
              <StatusBadge
                label={STATUS_LABELS[selectedDocument.status]}
                tone={selectedDocument.status}
              />
            </View>

            <View style={styles.sourceDocumentActions}>
              <Button
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/document/[id]',
                    params: { id: selectedDocument._id },
                  })
                }
              >
                Open overview
              </Button>
              <Button
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/document/[id]/quizzes',
                    params: { id: selectedDocument._id },
                  })
                }
              >
                Open document quizzes
              </Button>
            </View>
          </View>
        </Card>
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
    <Card>
      <View style={styles.metricCard}>
        <Text style={styles.metricLabel}>{title}</Text>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricDescription}>{description}</Text>
      </View>
    </Card>
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
  filterChipList: {
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
    minHeight: theme.layout.touchTarget,
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
  warningText: {
    color: theme.colors.warning,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  metricGrid: {
    gap: theme.spacing.md,
  },
  metricCard: {
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
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
  },
  metricDescription: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  mutedText: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  loadingStack: {
    gap: theme.spacing.md,
  },
  loadingLineLarge: {
    width: '78%',
    height: 16,
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
  sourceDocumentCard: {
    gap: theme.spacing.lg,
  },
  sourceDocumentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  sourceDocumentText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  sourceDocumentTitle: {
    color: theme.colors.text,
    fontSize: theme.typeScale.title.fontSize,
    lineHeight: theme.typeScale.title.lineHeight,
    fontWeight: '700',
  },
  sourceDocumentSubtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  sourceDocumentActions: {
    gap: theme.spacing.md,
  },
});
