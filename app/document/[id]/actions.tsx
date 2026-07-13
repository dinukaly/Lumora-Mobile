import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  type ExplainConceptResponse,
  type LatestConceptsArtifact,
  type LatestSummaryArtifact,
  useExplainConceptMutation,
  useExtractConceptsMutation,
  useGetLatestAIActionsQuery,
  useSummarizeDocumentMutation,
} from '@/api/aiActionsApi';
import { useGetDocumentQuery } from '@/api/documentsApi';
import { CitationCard } from '@/components/chat';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  InlineNotice,
  Screen,
} from '@/components/ui';
import { theme } from '@/theme';
import { getApiFormErrorState } from '@/utils/apiErrors';

type ExplanationState = {
  topic: string;
  result: ExplainConceptResponse;
} | null;

export default function DocumentActionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const documentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [actionError, setActionError] = useState<string | null>(null);
  const [explanationState, setExplanationState] = useState<ExplanationState>(null);
  const [explainingTopic, setExplainingTopic] = useState<string | null>(null);
  const {
    data: document,
    error: documentError,
    isLoading: documentLoading,
    refetch: refetchDocument,
  } = useGetDocumentQuery(documentId ?? '', {
    skip: !documentId,
  });
  const {
    data: latestActions,
    error: latestActionsError,
    isLoading: latestActionsLoading,
    isFetching: latestActionsFetching,
    refetch: refetchLatestActions,
  } = useGetLatestAIActionsQuery(documentId ?? '', {
    skip: !documentId || document?.status !== 'READY',
  });
  const [summarizeDocument, { isLoading: isSummarizing }] =
    useSummarizeDocumentMutation();
  const [extractConcepts, { isLoading: isExtractingConcepts }] =
    useExtractConceptsMutation();
  const [explainConcept, { isLoading: isExplaining }] =
    useExplainConceptMutation();

  const isDocumentReady = document?.status === 'READY';
  const summaryArtifact = latestActions?.summary ?? null;
  const conceptsArtifact = latestActions?.concepts ?? null;

  async function handleGenerateSummary() {
    if (!documentId) {
      return;
    }

    setActionError(null);

    try {
      await summarizeDocument({ documentId }).unwrap();
    } catch (error) {
      setActionError(
        getApiFormErrorState(error).formError ??
          'We could not generate a summary right now.',
      );
    }
  }

  async function handleGenerateConcepts() {
    if (!documentId) {
      return;
    }

    setActionError(null);

    try {
      await extractConcepts({ documentId }).unwrap();
    } catch (error) {
      setActionError(
        getApiFormErrorState(error).formError ??
          'We could not extract concepts right now.',
      );
    }
  }

  async function handleExplainTopic(topic: string) {
    if (!documentId || !topic.trim()) {
      return;
    }

    setActionError(null);
    setExplainingTopic(topic);

    try {
      const result = await explainConcept({
        documentId,
        topic,
      }).unwrap();

      setExplanationState({ topic, result });
    } catch (error) {
      setActionError(
        getApiFormErrorState(error).formError ??
          'We could not generate that deep dive right now.',
      );
    } finally {
      setExplainingTopic(null);
    }
  }

  if (!documentId) {
    return (
      <Screen
        title="AI actions"
        subtitle="We could not identify which document action workspace to open."
      >
        <ErrorState
          title="Document unavailable"
          description="Return to the documents library and open the document again."
          onRetry={() => router.push('/(tabs)/documents')}
          retryLabel="Back to library"
        />
      </Screen>
    );
  }

  if (documentLoading && !document) {
    return (
      <Screen
        title="AI actions"
        subtitle="Loading the document and its saved study artifacts."
      >
        <View style={styles.loadingStack}>
          <Card>
            <View style={styles.loadingLineLarge} />
            <View style={styles.loadingLineMedium} />
            <View style={styles.loadingLineSmall} />
          </Card>
          <Card>
            <View style={styles.loadingLineLarge} />
            <View style={styles.loadingBlock} />
          </Card>
        </View>
      </Screen>
    );
  }

  if (!document && documentError) {
    return (
      <Screen
        title="AI actions"
        subtitle="We could not load this document's AI workspace."
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
      title={document?.title ? `AI actions for ${document.title}` : 'AI actions'}
      subtitle="Generate saved summaries, key concepts, and deeper explanations grounded in this document."
      refreshing={latestActionsFetching}
      onRefresh={isDocumentReady ? () => void refetchLatestActions() : undefined}
      headerRight={
        <Button
          size="sm"
          variant="ghost"
          onPress={() =>
            router.push({
              pathname: '/document/[id]/chat',
              params: { id: documentId },
            })
          }
        >
          Chat
        </Button>
      }
    >
      {!isDocumentReady ? (
        <EmptyState
          eyebrow="Processing required"
          title="AI actions unlock when the document is READY"
          description={
            document?.status === 'FAILED'
              ? document.processingError ||
                'Processing failed, so saved AI actions are not available yet.'
              : 'Lumora needs to finish indexing this document before summaries and concepts can be generated.'
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

      {isDocumentReady && latestActionsError && !latestActions ? (
        <ErrorState
          title="AI actions unavailable"
          description="We could not load the latest saved summary and concept artifacts."
          onRetry={() => void refetchLatestActions()}
        />
      ) : null}

      {actionError ? (
        <View style={styles.inlineAlert}>
          <Text style={styles.inlineAlertText}>{actionError}</Text>
        </View>
      ) : null}

      {documentError && document ? (
        <InlineNotice message="This document is showing cached details. Pull to refresh and try again." />
      ) : null}

      {isDocumentReady && latestActionsError && latestActions ? (
        <InlineNotice message="Saved AI actions are showing cached data. Pull to refresh and try again." />
      ) : null}

      {isDocumentReady ? (
        <>
          <Card
            title="Generate"
            description="Create or refresh the saved study artifacts for this document."
          >
            <View style={styles.generateActions}>
              <Button
                fullWidth
                loading={isSummarizing}
                onPress={() => void handleGenerateSummary()}
              >
                {summaryArtifact ? 'Regenerate summary' : 'Generate summary'}
              </Button>
              <Button
                fullWidth
                loading={isExtractingConcepts}
                variant="secondary"
                onPress={() => void handleGenerateConcepts()}
              >
                {conceptsArtifact ? 'Regenerate concepts' : 'Generate concepts'}
              </Button>
            </View>
          </Card>

          <SummaryCard
            artifact={summaryArtifact}
            isLoading={latestActionsLoading}
            isExplaining={isExplaining}
            explainingTopic={explainingTopic}
            onExplainTopic={handleExplainTopic}
          />

          <ConceptsCard
            artifact={conceptsArtifact}
            isLoading={latestActionsLoading}
            isExplaining={isExplaining}
            explainingTopic={explainingTopic}
            onExplainTopic={handleExplainTopic}
          />

          {explanationState ? (
            <ExplanationCard
              explanationState={explanationState}
              onDismiss={() => setExplanationState(null)}
            />
          ) : null}

          <Card
            title="Learning shortcuts"
            description="Jump from saved actions into active practice for this same document."
          >
            <View style={styles.shortcutRow}>
              <Button
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/document/[id]/flashcards',
                    params: { id: documentId },
                  })
                }
              >
                Flashcards
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
                Quizzes
              </Button>
            </View>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function SummaryCard({
  artifact,
  isLoading,
  isExplaining,
  explainingTopic,
  onExplainTopic,
}: {
  artifact: LatestSummaryArtifact | null;
  isLoading: boolean;
  isExplaining: boolean;
  explainingTopic: string | null;
  onExplainTopic: (topic: string) => void;
}) {
  if (!artifact) {
    return (
      <Card
        title="Summary"
        description="Saved document summary and takeaways will appear here once generated."
      >
        {isLoading ? (
          <View style={styles.loadingStack}>
            <View style={styles.loadingLineLarge} />
            <View style={styles.loadingLineMedium} />
            <View style={styles.loadingLineMedium} />
          </View>
        ) : (
          <Text style={styles.mutedText}>
            No saved summary yet. Generate one to capture the main ideas and takeaways.
          </Text>
        )}
      </Card>
    );
  }

  return (
    <Card
      title="Summary"
      description={`Saved ${formatDateTime(artifact.createdAt)}`}
    >
      <Text style={styles.bodyText}>{artifact.summary}</Text>

      {artifact.takeaways.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key takeaways</Text>
          <View style={styles.list}>
            {artifact.takeaways.map((takeaway) => {
              const loading = isExplaining && explainingTopic === takeaway;

              return (
                <View key={takeaway} style={styles.takeawayRow}>
                  <Text style={styles.takeawayText}>{`\u2022 ${takeaway}`}</Text>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={loading}
                    onPress={() => void onExplainTopic(takeaway)}
                  >
                    Explain
                  </Button>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {artifact.citations.length ? (
        <CitationSection citations={artifact.citations} />
      ) : null}
    </Card>
  );
}

function ConceptsCard({
  artifact,
  isLoading,
  isExplaining,
  explainingTopic,
  onExplainTopic,
}: {
  artifact: LatestConceptsArtifact | null;
  isLoading: boolean;
  isExplaining: boolean;
  explainingTopic: string | null;
  onExplainTopic: (topic: string) => void;
}) {
  if (!artifact) {
    return (
      <Card
        title="Key concepts"
        description="Saved concept cards will appear here once generated."
      >
        {isLoading ? (
          <View style={styles.loadingStack}>
            <View style={styles.loadingLineLarge} />
            <View style={styles.loadingBlock} />
          </View>
        ) : (
          <Text style={styles.mutedText}>
            No saved concepts yet. Generate them to break the document into focused study topics.
          </Text>
        )}
      </Card>
    );
  }

  return (
    <Card
      title="Key concepts"
      description={`Saved ${formatDateTime(artifact.createdAt)}`}
    >
      <View style={styles.list}>
        {artifact.concepts.map((concept) => {
          const loading = isExplaining && explainingTopic === concept.title;

          return (
            <Pressable
              key={concept.title}
              accessibilityRole="button"
              onPress={() => void onExplainTopic(concept.title)}
              style={({ pressed }) => [
                styles.conceptCard,
                pressed ? styles.conceptCardPressed : null,
              ]}
            >
              <View style={styles.conceptHeader}>
                <Text style={styles.conceptTitle}>{concept.title}</Text>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={loading}
                  onPress={() => void onExplainTopic(concept.title)}
                >
                  Explain
                </Button>
              </View>
              <Text style={styles.mutedText}>{concept.description}</Text>
            </Pressable>
          );
        })}
      </View>

      {artifact.citations.length ? (
        <CitationSection citations={artifact.citations} />
      ) : null}
    </Card>
  );
}

function ExplanationCard({
  explanationState,
  onDismiss,
}: {
  explanationState: ExplanationState;
  onDismiss: () => void;
}) {
  if (!explanationState) {
    return null;
  }

  return (
    <Card
      title={`Deep dive: ${explanationState.topic}`}
      description="Generated grounded explanation for the selected concept or takeaway."
    >
      <Text style={styles.bodyText}>{explanationState.result.explanation}</Text>
      {explanationState.result.citations.length ? (
        <CitationSection citations={explanationState.result.citations} />
      ) : null}
      <View style={styles.dismissRow}>
        <Button size="sm" variant="ghost" onPress={onDismiss}>
          Dismiss
        </Button>
      </View>
    </Card>
  );
}

function CitationSection({
  citations,
}: {
  citations: NonNullable<LatestSummaryArtifact['citations']>;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Sources</Text>
      <View style={styles.list}>
        {citations.map((citation, index) => (
          <CitationCard
            key={`${citation.chunkId ?? 'citation'}-${index}`}
            citation={citation}
          />
        ))}
      </View>
    </View>
  );
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
  generateActions: {
    gap: theme.spacing.md,
  },
  shortcutRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  bodyText: {
    color: theme.colors.text,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  mutedText: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typeScale.label.fontSize,
    lineHeight: theme.typeScale.label.lineHeight,
    fontWeight: '700',
  },
  list: {
    gap: theme.spacing.md,
  },
  takeawayRow: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  takeawayText: {
    color: theme.colors.text,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  conceptCard: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  conceptCardPressed: {
    opacity: 0.88,
  },
  conceptHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  conceptTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typeScale.title.fontSize,
    lineHeight: theme.typeScale.title.lineHeight,
    fontWeight: '700',
  },
  dismissRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  loadingStack: {
    gap: theme.spacing.md,
  },
  loadingLineLarge: {
    width: '72%',
    height: 18,
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
    height: 120,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceSoft,
  },
});
