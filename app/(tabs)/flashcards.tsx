import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  type DocumentData,
  useListDocumentsQuery,
} from '@/api/documentsApi';
import {
  type FlashcardDifficulty,
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
} from '@/components/ui';
import { theme } from '@/theme';
import { getApiFormErrorState } from '@/utils/apiErrors';

const DOCUMENT_PAGE_SIZE = 100;
const FLASHCARD_PAGE_SIZE = 100;

const STATUS_LABELS: Record<DocumentData['status'], string> = {
  UPLOADED: 'Uploaded',
  PROCESSING: 'Processing',
  READY: 'Ready',
  FAILED: 'Failed',
};

export default function FlashcardsScreen() {
  const router = useRouter();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>();
  const [dueOnly, setDueOnly] = useState(true);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

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
    data: allCardsData,
    error: allCardsError,
    isLoading: allCardsLoading,
    isFetching: allCardsFetching,
    refetch: refetchAllCards,
  } = useListFlashcardsQuery({
    documentId: selectedDocumentId,
    page: 1,
    limit: FLASHCARD_PAGE_SIZE,
  });
  const {
    data: visibleCardsData,
    error: visibleCardsError,
    isLoading: visibleCardsLoading,
    isFetching: visibleCardsFetching,
    refetch: refetchVisibleCards,
  } = useListFlashcardsQuery({
    documentId: selectedDocumentId,
    dueOnly,
    page: 1,
    limit: FLASHCARD_PAGE_SIZE,
  });
  const {
    data: dueCardsData,
    isFetching: dueCardsFetching,
    refetch: refetchDueCards,
  } = useListFlashcardsQuery({
    documentId: selectedDocumentId,
    dueOnly: true,
    page: 1,
    limit: 1,
  });
  const [reviewFlashcard, { isLoading: isReviewing }] =
    useReviewFlashcardMutation();

  const documents = documentsData?.documents ?? [];
  const allCards = allCardsData?.flashcards ?? [];
  const visibleCards = visibleCardsData?.flashcards ?? [];
  const dueCount = dueCardsData?.total ?? 0;
  const resolvedActiveCardId = visibleCards.some((card) => card.id === activeCardId)
    ? activeCardId
    : visibleCards.find((card) => isDue(card.nextReviewAt))?.id ??
      visibleCards[0]?.id ??
      null;
  const selectedDocument =
    documents.find((document) => document._id === selectedDocumentId) ?? null;
  const activeCard =
    visibleCards.find((card) => card.id === resolvedActiveCardId) ?? null;
  const activeCardDocument = activeCard
    ? documents.find((document) => document._id === activeCard.documentId) ?? null
    : null;
  const focusDocumentId = selectedDocumentId ?? activeCard?.documentId ?? null;
  const focusDocument = selectedDocument ?? activeCardDocument;
  const reviewedCards = allCards.filter((card) => card.reviewCount > 0).length;
  const reviewedProgress = allCards.length
    ? Math.round((reviewedCards / allCards.length) * 100)
    : 0;
  const reviewedDeck = allCards.filter((card) => card.reviewCount > 0);
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
  const cardLoadError = allCardsError ?? visibleCardsError;
  const isRefreshing =
    documentsFetching ||
    allCardsFetching ||
    visibleCardsFetching ||
    dueCardsFetching;
  const isResolvedCardRevealed =
    revealed && resolvedActiveCardId != null && resolvedActiveCardId === activeCardId;

  function handleRefresh() {
    setReviewError(null);
    void refetchDocuments();
    void refetchAllCards();
    void refetchVisibleCards();
    void refetchDueCards();
  }

  async function handleReview(difficulty: FlashcardDifficulty) {
    if (!activeCard) {
      return;
    }

    setReviewError(null);

    try {
      await reviewFlashcard({
        id: activeCard.id,
        difficulty,
      }).unwrap();
      setRevealed(false);
    } catch (error) {
      setReviewError(
        getApiFormErrorState(error).formError ??
          'We could not save that review right now.',
      );
    }
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

  return (
    <Screen
      title="Flashcards"
      subtitle="Review due cards across your documents and keep active recall moving."
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      headerRight={
        focusDocumentId ? (
          <Button
            size="sm"
            variant="ghost"
            onPress={() =>
              router.push({
                pathname: '/document/[id]',
                params: { id: focusDocumentId },
              })
            }
          >
            Document
          </Button>
        ) : undefined
      }
    >
      {reviewError ? (
        <View style={styles.inlineAlert}>
          <Text style={styles.inlineAlertText}>{reviewError}</Text>
        </View>
      ) : null}

      {documentsError && documents.length > 0 ? (
        <InlineNotice message="Document filters are showing cached data. Pull to refresh and try again." />
      ) : null}

      {cardLoadError && (allCardsData || visibleCardsData) ? (
        <InlineNotice message="Flashcards are showing cached data. Pull to refresh and try again." />
      ) : null}

      <Card
        title="Filters"
        description="Review every due card or narrow the deck to one document."
      >
        <View style={styles.filterActionRow}>
          <Button
            size="sm"
            variant={dueOnly ? 'primary' : 'secondary'}
            onPress={() => setDueOnly((current) => !current)}
          >
            {dueOnly ? 'Due only' : 'All cards'}
          </Button>
          {selectedDocumentId ? (
            <Button
              size="sm"
              variant="ghost"
              onPress={() => setSelectedDocumentId(undefined)}
            >
              All documents
            </Button>
          ) : null}
        </View>

        {documentsLoading && !documents.length ? (
          <Text style={styles.mutedText}>Loading document filters...</Text>
        ) : null}

        {documents.length ? (
          <View style={styles.documentChipList}>
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
        ) : null}

        {documentsError && !documents.length ? (
          <Text style={styles.warningText}>
            Document filters are unavailable right now. You can still review the current deck.
          </Text>
        ) : null}
      </Card>

      <View style={styles.metricGrid}>
        <MetricCard
          title="Total cards"
          value={allCardsData?.total ?? 0}
          description="Cards in this current selection"
        />
        <MetricCard
          title="Due now"
          value={dueCount}
          description="Ready for immediate review"
        />
        <MetricCard
          title="Progress"
          value={`${reviewedProgress}%`}
          description={
            reviewedDeck.length
              ? `${reviewedCards} reviewed, ${averageSuccessRate}% average success`
              : 'Start reviewing to build your repetition history'
          }
        />
      </View>

      {selectedDocument && selectedDocument.status !== 'READY' ? (
        <EmptyState
          eyebrow="Not ready yet"
          title="This document is not ready for flashcard study"
          description={
            selectedDocument.status === 'PROCESSING'
              ? 'Wait for document processing to finish before expecting new flashcards.'
              : selectedDocument.status === 'FAILED'
                ? selectedDocument.processingError ||
                  'Processing failed, so flashcards are unavailable for now.'
                : 'Flashcards unlock once this document reaches READY.'
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
        title="Review deck"
        description="Reveal the answer, then score how well you remembered it."
      >
        {allCardsLoading || visibleCardsLoading ? (
          <View style={styles.loadingState}>
            <View style={styles.loadingCard} />
            <View style={styles.loadingLineLarge} />
            <View style={styles.loadingLineSmall} />
          </View>
        ) : null}

        {!allCardsLoading && !visibleCardsLoading && cardLoadError ? (
          <ErrorState
            title="Flashcards unavailable"
            description="We could not load this flashcard deck right now."
            onRetry={handleRefresh}
          />
        ) : null}

        {!allCardsLoading && !visibleCardsLoading && !cardLoadError && !activeCard ? (
          <View style={styles.emptyDeckState}>
            <Text style={styles.emptyDeckTitle}>No flashcards ready yet</Text>
            <Text style={styles.mutedText}>
              {dueOnly
                ? 'Nothing is due in this deck right now. Switch to all cards if you want to browse ahead.'
                : 'This selection does not have any flashcards yet. Generate a deck from a ready document next.'}
            </Text>
          </View>
        ) : null}

        {activeCard ? (
          <View style={styles.reviewStack}>
            <FlashcardReviewCard
              flashcard={activeCard}
              revealed={isResolvedCardRevealed}
              documentTitle={getDocumentTitle(documents, activeCard.documentId)}
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
                <Text style={styles.sectionTitle}>How well did you remember it?</Text>
                <Text style={styles.mutedText}>
                  Lumora will schedule the next repetition based on your confidence.
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
          description="Jump to a specific prompt in the current deck."
        >
          <View style={styles.deckList}>
            {visibleCards.map((card) => {
              const selected = card.id === activeCardId;

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
                      {getDocumentTitle(documents, card.documentId)}
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

      {focusDocument ? (
        <Card
          title="Source document"
          description="Open the document overview to keep studying in context."
        >
          <View style={styles.sourceDocumentCard}>
            <View style={styles.sourceDocumentHeader}>
              <View style={styles.sourceDocumentText}>
                <Text style={styles.sourceDocumentTitle}>{focusDocument.title}</Text>
                <Text style={styles.sourceDocumentSubtitle}>
                  {focusDocument.originalFileName}
                </Text>
              </View>
              <StatusBadge
                label={STATUS_LABELS[focusDocument.status]}
                tone={focusDocument.status}
              />
            </View>
            <Button
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/document/[id]',
                  params: { id: focusDocument._id },
                })
              }
            >
              Open overview
            </Button>
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

function getDocumentTitle(documents: DocumentData[], documentId: string) {
  const match = documents.find((document) => document._id === documentId);
  return match?.title ?? 'Document';
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
  filterActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  documentChipList: {
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
  mutedText: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
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
  loadingState: {
    gap: theme.spacing.lg,
  },
  loadingCard: {
    minHeight: 280,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surfaceSoft,
  },
  loadingLineLarge: {
    width: '80%',
    height: 16,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  loadingLineSmall: {
    width: '52%',
    height: 16,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  emptyDeckState: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing['2xl'],
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  emptyDeckTitle: {
    color: theme.colors.text,
    fontSize: theme.typeScale.title.fontSize,
    lineHeight: theme.typeScale.title.lineHeight,
    fontWeight: '700',
    textAlign: 'center',
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
  metaText: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
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
    flex: 1,
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
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
});
