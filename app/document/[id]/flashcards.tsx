import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useGetDocumentQuery } from '@/api/documentsApi';
import {
  type FlashcardDifficulty,
  useGenerateFlashcardsMutation,
  useListFlashcardsQuery,
  useReviewFlashcardMutation,
} from '@/api/flashcardsApi';
import { FlashcardReviewCard } from '@/components/learning';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  InlineNotice,
  Screen,
  StatusBadge,
  TextField,
} from '@/components/ui';
import { theme } from '@/theme';
import { getApiFormErrorState } from '@/utils/apiErrors';

const FLASHCARD_PAGE_SIZE = 100;

export default function DocumentFlashcardsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const documentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [dueOnly, setDueOnly] = useState(false);
  const [topic, setTopic] = useState('');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
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
    data: allCardsData,
    error: allCardsError,
    isLoading: allCardsLoading,
    isFetching: allCardsFetching,
    refetch: refetchAllCards,
  } = useListFlashcardsQuery(
    documentId
      ? {
          documentId,
          page: 1,
          limit: FLASHCARD_PAGE_SIZE,
        }
      : undefined,
    {
      skip: !documentId,
    },
  );
  const {
    data: visibleCardsData,
    error: visibleCardsError,
    isLoading: visibleCardsLoading,
    isFetching: visibleCardsFetching,
    refetch: refetchVisibleCards,
  } = useListFlashcardsQuery(
    documentId
      ? {
          documentId,
          dueOnly,
          page: 1,
          limit: FLASHCARD_PAGE_SIZE,
        }
      : undefined,
    {
      skip: !documentId,
    },
  );
  const {
    data: dueCardsData,
    isFetching: dueCardsFetching,
    refetch: refetchDueCards,
  } = useListFlashcardsQuery(
    documentId
      ? {
          documentId,
          dueOnly: true,
          page: 1,
          limit: 1,
        }
      : undefined,
    {
      skip: !documentId,
    },
  );
  const [generateFlashcards, { isLoading: isGenerating }] =
    useGenerateFlashcardsMutation();
  const [reviewFlashcard, { isLoading: isReviewing }] =
    useReviewFlashcardMutation();

  const allCards = allCardsData?.flashcards ?? [];
  const visibleCards = visibleCardsData?.flashcards ?? [];
  const dueCount = dueCardsData?.total ?? 0;
  const isDocumentReady = document?.status === 'READY';
  const resolvedActiveCardId = visibleCards.some((card) => card.id === activeCardId)
    ? activeCardId
    : visibleCards.find((card) => isDue(card.nextReviewAt))?.id ??
      visibleCards[0]?.id ??
      null;
  const activeCard =
    visibleCards.find((card) => card.id === resolvedActiveCardId) ?? null;
  const isResolvedCardRevealed =
    revealed && resolvedActiveCardId != null && resolvedActiveCardId === activeCardId;
  const reviewedCards = allCards.filter((card) => card.reviewCount > 0).length;
  const reviewedDeck = allCards.filter((card) => card.reviewCount > 0);
  const reviewedProgress = allCards.length
    ? Math.round((reviewedCards / allCards.length) * 100)
    : 0;
  const averageSuccessRate = reviewedDeck.length
    ? Math.round(
        reviewedDeck.reduce((total, card) => {
          if (card.reviewCount === 0) {
            return total;
          }

          return total + card.successCount / card.reviewCount;
        }, 0) /
          reviewedDeck.length *
          100,
      )
    : 0;
  const cardsError = allCardsError ?? visibleCardsError;
  const isRefreshing =
    documentFetching ||
    allCardsFetching ||
    visibleCardsFetching ||
    dueCardsFetching;

  async function handleGenerate() {
    if (!documentId) {
      return;
    }

    setActionError(null);
    setQueueMessage(null);

    try {
      const result = await generateFlashcards({
        documentId,
        count: 12,
        topic: topic.trim() ? topic.trim() : undefined,
      }).unwrap();

      setQueueMessage(
        `${result.message}. Pull to refresh in a moment or wait for the ready notification.`,
      );
    } catch (error) {
      setActionError(
        getApiFormErrorState(error).formError ??
          'We could not queue flashcard generation right now.',
      );
    }
  }

  async function handleReview(difficulty: FlashcardDifficulty) {
    if (!activeCard) {
      return;
    }

    setActionError(null);

    try {
      await reviewFlashcard({
        id: activeCard.id,
        difficulty,
      }).unwrap();
      setRevealed(false);
    } catch (error) {
      setActionError(
        getApiFormErrorState(error).formError ??
          'We could not save that flashcard review right now.',
      );
    }
  }

  function handleRefresh() {
    setActionError(null);
    void refetchDocument();
    void refetchAllCards();
    void refetchVisibleCards();
    void refetchDueCards();
  }

  function handleToggleReveal() {
    if (!resolvedActiveCardId) {
      return;
    }

    if (resolvedActiveCardId !== activeCardId) {
      setActiveCardId(resolvedActiveCardId);
      setRevealed(true);
      return;
    }

    setRevealed((current) => !current);
  }

  if (!documentId) {
    return (
      <Screen
        title="Document flashcards"
        subtitle="We could not identify which document deck to open."
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
        title="Document flashcards"
        subtitle="Loading the document and its study deck."
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
        title="Document flashcards"
        subtitle="We could not load this document's flashcard workspace."
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
      title={document?.title ? `Flashcards for ${document.title}` : 'Document flashcards'}
      subtitle="Generate a focused deck for this document and review it with spaced repetition."
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

      {documentError && document ? (
        <InlineNotice message="This document is showing cached details. Pull to refresh and try again." />
      ) : null}

      {cardsError && (allCardsData || visibleCardsData) ? (
        <InlineNotice message="Flashcards are showing cached data. Pull to refresh and try again." />
      ) : null}

      {!isDocumentReady ? (
        <EmptyState
          eyebrow="Processing required"
          title="Flashcards unlock when the document is READY"
          description={
            document?.status === 'FAILED'
              ? document.processingError ||
                'Processing failed, so generation and review are unavailable for now.'
              : 'Lumora needs to finish processing this document before it can generate or review flashcards.'
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
            title="Deck summary"
            description="Track how much of this document deck is ready and due."
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
                title="Total cards"
                value={allCardsData?.total ?? 0}
                description="Cards currently saved for this document"
              />
              <MetricCard
                title="Due now"
                value={dueCount}
                description="Cards ready for immediate recall practice"
              />
              <MetricCard
                title="Progress"
                value={`${reviewedProgress}%`}
                description={
                  reviewedDeck.length
                    ? `${reviewedCards} reviewed, ${averageSuccessRate}% average success`
                    : 'Start reviewing to build spaced repetition history'
                }
              />
            </View>
          </Card>

          <Card
            title="Generate flashcards"
            description="Queue a new 12-card deck for this document, optionally focused on one topic."
          >
            <View style={styles.generateStack}>
              <TextField
                label="Focus topic"
                placeholder="Optional topic, chapter, or concept"
                value={topic}
                onChangeText={setTopic}
                autoCapitalize="sentences"
                autoCorrect={false}
                hint="Leave blank to generate flashcards across the full document."
              />
              <View style={styles.generateActions}>
                <Button
                  fullWidth
                  loading={isGenerating}
                  onPress={() => void handleGenerate()}
                >
                  Generate 12 flashcards
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  onPress={handleRefresh}
                >
                  Refresh deck
                </Button>
              </View>
            </View>
          </Card>

          <Card
            title="Review deck"
            description="Flip the current card, reveal the answer, then score your recall."
          >
            <View style={styles.filterRow}>
              <Button
                size="sm"
                variant={dueOnly ? 'primary' : 'secondary'}
                onPress={() => setDueOnly((current) => !current)}
              >
                {dueOnly ? 'Due only' : 'All cards'}
              </Button>
              <Text style={styles.metaText}>
                {dueOnly
                  ? 'Showing only cards due for review.'
                  : 'Showing every saved card for this document.'}
              </Text>
            </View>

            {allCardsLoading || visibleCardsLoading ? (
              <View style={styles.loadingState}>
                <View style={styles.loadingCard} />
                <View style={styles.loadingLineLarge} />
                <View style={styles.loadingLineSmall} />
              </View>
            ) : null}

            {!allCardsLoading && !visibleCardsLoading && cardsError ? (
              <ErrorState
                title="Flashcards unavailable"
                description="We could not load this document's flashcards right now."
                onRetry={handleRefresh}
              />
            ) : null}

            {!allCardsLoading &&
            !visibleCardsLoading &&
            !cardsError &&
            !activeCard ? (
              <EmptyState
                eyebrow="Deck empty"
                title="No flashcards are ready yet"
                description={
                  dueOnly
                    ? 'Nothing is due right now. Switch to all cards if you want to browse the full deck.'
                    : 'Generate a deck for this document to start reviewing cards here.'
                }
                actionLabel={dueOnly ? 'Show all cards' : 'Generate flashcards'}
                onAction={
                  dueOnly
                    ? () => setDueOnly(false)
                    : () => void handleGenerate()
                }
              />
            ) : null}

            {activeCard ? (
              <View style={styles.reviewStack}>
                <FlashcardReviewCard
                  flashcard={activeCard}
                  revealed={isResolvedCardRevealed}
                  documentTitle={document.title}
                  onToggleReveal={handleToggleReveal}
                />

                <View style={styles.reviewMetaRow}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={handleToggleReveal}
                  >
                    {isResolvedCardRevealed ? 'Hide answer' : 'Show answer'}
                  </Button>
                  <Text style={styles.metaText}>
                    Next review {formatDateTime(activeCard.nextReviewAt)}
                  </Text>
                </View>

                {isResolvedCardRevealed ? (
                  <View style={styles.reviewActions}>
                    <Text style={styles.sectionTitle}>
                      How well did you remember it?
                    </Text>
                    <Text style={styles.mutedText}>
                      Lumora will use your confidence to schedule the next repetition.
                    </Text>
                    <View style={styles.difficultyRow}>
                      <DifficultyButton
                        label="Hard"
                        tone="hard"
                        disabled={isReviewing}
                        onPress={() => void handleReview('HARD')}
                      />
                      <DifficultyButton
                        label="Good"
                        tone="medium"
                        disabled={isReviewing}
                        onPress={() => void handleReview('MEDIUM')}
                      />
                      <DifficultyButton
                        label="Easy"
                        tone="easy"
                        disabled={isReviewing}
                        onPress={() => void handleReview('EASY')}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}
          </Card>

          {visibleCards.length ? (
            <Card
              title="Deck overview"
              description="Jump to a specific flashcard prompt in this document."
            >
              <View style={styles.deckList}>
                {visibleCards.map((card) => {
                  const selected = card.id === resolvedActiveCardId;

                  return (
                    <Pressable
                      key={card.id}
                      accessibilityRole="button"
                      onPress={() => {
                        setActiveCardId(card.id);
                        setRevealed(false);
                      }}
                      style={({ pressed }) => [
                        styles.deckItem,
                        selected ? styles.deckItemSelected : null,
                        pressed ? styles.deckItemPressed : null,
                      ]}
                    >
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.deckItemTitle,
                          selected ? styles.deckItemTitleSelected : null,
                        ]}
                      >
                        {card.front}
                      </Text>
                      <View style={styles.deckMetaRow}>
                        <Text style={styles.deckMetaText}>
                          {card.reviewCount} reviews
                        </Text>
                        <Text style={styles.deckMetaText}>
                          {isDue(card.nextReviewAt)
                            ? 'Due now'
                            : formatRelativeDate(card.nextReviewAt)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          ) : null}

          <Card
            title="Next study step"
            description="Continue from flashcards into another document-specific practice mode."
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
                    pathname: '/document/[id]/quizzes',
                    params: { id: documentId },
                  })
                }
              >
                Open quizzes
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

function DifficultyButton({
  label,
  tone,
  disabled = false,
  onPress,
}: {
  label: string;
  tone: 'hard' | 'medium' | 'easy';
  disabled?: boolean;
  onPress: () => void;
}) {
  const palette =
    tone === 'hard'
      ? {
          backgroundColor: theme.colors.dangerSoft,
          borderColor: '#FCA5A5',
          textColor: '#B91C1C',
        }
      : tone === 'medium'
        ? {
            backgroundColor: theme.colors.warningSoft,
            borderColor: '#FCD34D',
            textColor: '#B45309',
          }
        : {
            backgroundColor: theme.colors.successSoft,
            borderColor: '#86EFAC',
            textColor: '#047857',
          };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.difficultyButton,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: disabled ? 0.55 : pressed ? 0.88 : 1,
        },
      ]}
    >
      <Text style={[styles.difficultyButtonText, { color: palette.textColor }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function isDue(nextReviewAt: string) {
  return new Date(nextReviewAt).getTime() <= Date.now();
}

function formatRelativeDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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
  loadingState: {
    gap: theme.spacing.lg,
  },
  loadingCard: {
    minHeight: 280,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surfaceSoft,
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
  generateActions: {
    gap: theme.spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  reviewStack: {
    gap: theme.spacing.lg,
  },
  reviewMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  reviewActions: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typeScale.label.fontSize,
    lineHeight: theme.typeScale.label.lineHeight,
    fontWeight: '700',
  },
  mutedText: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  metaText: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    flex: 1,
  },
  difficultyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  difficultyButton: {
    minWidth: 92,
    minHeight: 44,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyButtonText: {
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    fontWeight: '700',
  },
  deckList: {
    gap: theme.spacing.md,
  },
  deckItem: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  deckItemSelected: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.backgroundMuted,
  },
  deckItemPressed: {
    opacity: 0.88,
  },
  deckItemTitle: {
    color: theme.colors.text,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
    fontWeight: '600',
  },
  deckItemTitleSelected: {
    color: theme.colors.brandSoft,
  },
  deckMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  deckMetaText: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  nextStepActions: {
    gap: theme.spacing.md,
  },
});
