import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useGetDocumentQuery } from '@/api/documentsApi';
import {
  type ConversationMessage,
  conversationsApi,
  useGetConversationQuery,
  useListConversationsQuery,
  useSendChatMessageMutation,
} from '@/api/conversationsApi';
import { ChatMessageBubble } from '@/components/chat';
import { Button, EmptyState, ErrorState, TextField } from '@/components/ui';
import { isChatStreamingSupported } from '@/services/chatStream';
import { useAppDispatch } from '@/store/hooks';
import { theme } from '@/theme';
import { getApiFormErrorState } from '@/utils/apiErrors';

const HISTORY_LIMIT = 8;

type PendingChatState = {
  userMessage: ConversationMessage;
  conversationId?: string;
};

export default function DocumentChatScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const documentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const scrollRef = useRef<ScrollView | null>(null);
  const [composerValue, setComposerValue] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [isComposingNewConversation, setIsComposingNewConversation] =
    useState(false);
  const [pendingChat, setPendingChat] = useState<PendingChatState | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [sendChatMessage, { isLoading: isSending }] = useSendChatMessageMutation();

  const {
    data: document,
    error: documentError,
    isLoading: documentLoading,
    refetch: refetchDocument,
  } = useGetDocumentQuery(documentId ?? '', {
    skip: !documentId,
  });
  const {
    data: conversationList,
    error: conversationListError,
    isLoading: conversationListLoading,
    isFetching: conversationListFetching,
    refetch: refetchConversationList,
  } = useListConversationsQuery(
    documentId
      ? {
          documentId,
          page: 1,
          limit: HISTORY_LIMIT,
        }
      : undefined,
    {
      skip: !documentId,
    },
  );

  const latestConversationId = conversationList?.conversations[0]?.id ?? null;
  const activeConversationId = isComposingNewConversation
    ? null
    : selectedConversationId ?? latestConversationId;
  const {
    data: activeConversation,
    error: conversationDetailError,
    isLoading: conversationDetailLoading,
    isFetching: conversationDetailFetching,
    refetch: refetchActiveConversation,
  } = useGetConversationQuery(activeConversationId ?? '', {
    skip: !activeConversationId,
  });

  const isDocumentReady = document?.status === 'READY';
  const displayMessages = activeConversation?.messages
    ? [...activeConversation.messages]
    : [];

  if (pendingChat) {
    const alreadyPresent = pendingChat.conversationId
      ? pendingChat.conversationId === activeConversationId
      : !activeConversationId;

    if (alreadyPresent) {
      displayMessages.push(pendingChat.userMessage);
    }
  }

  if (isSending) {
    displayMessages.push({
      id: 'pending-assistant',
      role: 'assistant',
      content: 'Lumora is thinking through your document...',
      createdAt: new Date().toISOString(),
    });
  }

  useEffect(() => {
    if (!documentId) {
      return;
    }

    const timeoutId = setTimeout(() => {
      scrollToBottom(scrollRef);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [displayMessages.length, documentId]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
      scrollToBottom(scrollRef);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleStartNewChat = useCallback(() => {
    setIsComposingNewConversation(true);
    setSelectedConversationId(null);
    setPendingChat(null);
    setChatError(null);
  }, []);

  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsComposingNewConversation(false);
    setPendingChat(null);
    setChatError(null);
  }, []);

  const handleSend = useCallback(async () => {
    const nextMessage = composerValue.trim();
    const shouldUseStreaming = isChatStreamingSupported();

    if (!documentId || !nextMessage || !isDocumentReady || isSending) {
      return;
    }

    const now = new Date().toISOString();
    const pendingUserMessage: ConversationMessage = {
      id: `pending-user-${now}`,
      role: 'user',
      content: nextMessage,
      createdAt: now,
    };

    setChatError(null);
    setPendingChat({
      userMessage: pendingUserMessage,
      conversationId: activeConversationId ?? undefined,
    });

    if (shouldUseStreaming) {
      setChatError(
        'Streaming chat is not enabled in this build yet. Falling back to standard responses.',
      );
    }

    try {
      const response = await sendChatMessage({
        conversationId: activeConversationId ?? undefined,
        documentId,
        message: nextMessage,
        action: 'CHAT',
      }).unwrap();

      const resolvedConversationId = response.message.conversationId;
      setSelectedConversationId(resolvedConversationId);
      setIsComposingNewConversation(false);

      await Promise.all([
        dispatch(
          conversationsApi.endpoints.getConversation.initiate(
            resolvedConversationId,
            {
              forceRefetch: true,
              subscribe: false,
            },
          ),
        ).unwrap(),
        dispatch(
          conversationsApi.endpoints.listConversations.initiate(
            {
              documentId,
              page: 1,
              limit: HISTORY_LIMIT,
            },
            {
              forceRefetch: true,
              subscribe: false,
            },
          ),
        ).unwrap(),
      ]);

      setComposerValue('');
      setPendingChat(null);
    } catch (error) {
      setChatError(
        getApiFormErrorState(error).formError ??
          'We could not send your message right now.',
      );
      setPendingChat(null);
    }
  }, [
    activeConversationId,
    composerValue,
    dispatch,
    documentId,
    isDocumentReady,
    isSending,
    sendChatMessage,
  ]);

  if (!documentId) {
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.safeArea}>
        <View style={styles.centeredState}>
          <ErrorState
            title="Chat unavailable"
            description="We could not identify which document chat to open."
            onRetry={() => router.push('/(tabs)/documents')}
            retryLabel="Back to library"
          />
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (documentLoading && !document) {
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.safeArea}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={theme.colors.brand} size="large" />
          <Text style={styles.loadingText}>Loading document chat...</Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (!document && documentError) {
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.safeArea}>
        <View style={styles.centeredState}>
          <ErrorState
            title="Document unavailable"
            description="We could not load this document, so chat is not available right now."
            onRetry={() => void refetchDocument()}
          />
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      style={styles.safeArea}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text numberOfLines={1} style={styles.title}>
              {document?.title ?? 'Document chat'}
            </Text>
            <Text style={styles.subtitle}>
              Grounded in this document only. Ask for explanations, summaries, or clarifications.
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/document/[id]/pdf',
                  params: { id: documentId },
                })
              }
              style={({ pressed }) => [
                styles.headerChip,
                pressed ? styles.headerChipPressed : null,
              ]}
            >
              <Text style={styles.headerChipText}>PDF</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/document/[id]/actions',
                  params: { id: documentId },
                })
              }
              style={({ pressed }) => [
                styles.headerChip,
                pressed ? styles.headerChipPressed : null,
              ]}
            >
              <Text style={styles.headerChipText}>Actions</Text>
            </Pressable>
          </View>
        </View>

        {!isKeyboardVisible ? (
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View style={styles.historyHeaderText}>
              <Text style={styles.historyTitle}>Recent conversations</Text>
              <Text style={styles.historySubtitle}>
                Pick up where you left off or start a fresh document chat.
              </Text>
            </View>
            <Button
              size="sm"
              variant="ghost"
              onPress={handleStartNewChat}
            >
              New chat
            </Button>
          </View>

          {conversationListLoading && !conversationList ? (
            <ActivityIndicator color={theme.colors.brand} />
          ) : conversationListError && !conversationList ? (
            <ErrorState
              title="Conversation history unavailable"
              description="We could not load this document's previous chats right now."
              onRetry={() => void refetchConversationList()}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.historyRow}
            >
              <Pressable
                accessibilityRole="button"
                onPress={handleStartNewChat}
                style={({ pressed }) => [
                  styles.historyChip,
                  isComposingNewConversation ? styles.historyChipSelected : null,
                  pressed ? styles.historyChipPressed : null,
                ]}
              >
                <Text
                  style={[
                    styles.historyChipTitle,
                    isComposingNewConversation
                      ? styles.historyChipTitleSelected
                      : null,
                  ]}
                >
                  New chat
                </Text>
                <Text
                  style={[
                    styles.historyChipMeta,
                    isComposingNewConversation
                      ? styles.historyChipMetaSelected
                      : null,
                  ]}
                >
                  Fresh document thread
                </Text>
              </Pressable>

              {conversationList?.conversations.map((conversation) => {
                const selected = activeConversationId === conversation.id;

                return (
                  <Pressable
                    key={conversation.id}
                    accessibilityRole="button"
                    onPress={() => handleSelectConversation(conversation.id)}
                    style={({ pressed }) => [
                      styles.historyChip,
                      selected ? styles.historyChipSelected : null,
                      pressed ? styles.historyChipPressed : null,
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.historyChipTitle,
                        selected ? styles.historyChipTitleSelected : null,
                      ]}
                    >
                      {conversation.title}
                    </Text>
                    <Text
                      style={[
                        styles.historyChipMeta,
                        selected ? styles.historyChipMetaSelected : null,
                      ]}
                    >
                      {conversation.messageCount} messages
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
        ) : null}

        {chatError ? (
          <View style={styles.inlineAlert}>
            <Text style={styles.inlineAlertText}>{chatError}</Text>
          </View>
        ) : null}

        <View style={styles.messagesPanel}>
          {activeConversationId &&
          conversationDetailLoading &&
          !activeConversation &&
          !pendingChat ? (
            <View style={styles.centeredState}>
              <ActivityIndicator color={theme.colors.brand} size="large" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : conversationDetailError && !activeConversation && !pendingChat ? (
            <View style={styles.centeredState}>
              <ErrorState
                title="Chat unavailable"
                description="We could not load the selected conversation right now."
                onRetry={() => void refetchActiveConversation()}
              />
            </View>
          ) : displayMessages.length === 0 ? (
            <View style={styles.centeredState}>
              <EmptyState
                eyebrow={isDocumentReady ? 'Ready to learn' : 'Processing required'}
                title={
                  isDocumentReady
                    ? 'Start your first question'
                    : 'Chat unlocks when processing finishes'
                }
                description={
                  isDocumentReady
                    ? 'Ask about a concept, page, summary, or confusing section in this document.'
                    : 'Lumora needs this document to reach READY before grounded chat can begin.'
                }
                actionLabel={isDocumentReady ? 'Ask a question' : undefined}
                onAction={
                  isDocumentReady
                    ? () => {
                        scrollToBottom(scrollRef);
                      }
                    : undefined
                }
              />
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.messagesContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {displayMessages.map((message) => (
                <ChatMessageBubble
                  key={message.id}
                  message={message}
                  pending={message.id.startsWith('pending-')}
                />
              ))}
              {conversationDetailFetching ? (
                <Text style={styles.refreshingText}>
                  Refreshing conversation...
                </Text>
              ) : null}
              {conversationListFetching ? (
                <Text style={styles.refreshingText}>
                  Syncing conversation history...
                </Text>
              ) : null}
            </ScrollView>
          )}
        </View>

        <View style={styles.composerCard}>
          <TextField
            label="Message"
            multiline
            editable={isDocumentReady && !isSending}
            hint={
              isDocumentReady
                ? 'Ask about a section, idea, or page from this document.'
                : 'Chat becomes available when this document reaches READY.'
            }
            onChangeText={setComposerValue}
            placeholder={
              isDocumentReady
                ? 'Explain the key idea on page 4...'
                : 'Document processing must finish before chat opens.'
            }
            style={styles.composerInput}
            textAlignVertical="top"
            value={composerValue}
            onFocus={() => scrollToBottom(scrollRef)}
          />
          <View style={styles.composerActions}>
            <Button
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/document/[id]',
                  params: { id: documentId },
                })
              }
            >
              Overview
            </Button>
            <Button
              disabled={!isDocumentReady || !composerValue.trim() || isSending}
              loading={isSending}
              onPress={() => void handleSend()}
            >
              Send
            </Button>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function scrollToBottom(scrollRef: MutableRefObject<ScrollView | null>) {
  requestAnimationFrame(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typeScale.heading.fontSize,
    lineHeight: theme.typeScale.heading.lineHeight,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  headerChip: {
    minHeight: 40,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerChipPressed: {
    opacity: 0.84,
  },
  headerChipText: {
    color: theme.colors.text,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    fontWeight: '700',
  },
  historyCard: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  historyHeaderText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  historyTitle: {
    color: theme.colors.text,
    fontSize: theme.typeScale.title.fontSize,
    lineHeight: theme.typeScale.title.lineHeight,
    fontWeight: '700',
  },
  historySubtitle: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  historyRow: {
    gap: theme.spacing.sm,
  },
  historyChip: {
    width: 180,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  historyChipSelected: {
    borderColor: theme.colors.brandStrong,
    backgroundColor: theme.colors.brandSoft,
  },
  historyChipPressed: {
    opacity: 0.84,
  },
  historyChipTitle: {
    color: theme.colors.text,
    fontSize: theme.typeScale.label.fontSize,
    lineHeight: theme.typeScale.label.lineHeight,
    fontWeight: '700',
  },
  historyChipTitleSelected: {
    color: theme.colors.brandStrong,
  },
  historyChipMeta: {
    color: theme.colors.textSoft,
    fontSize: 12,
    lineHeight: 16,
  },
  historyChipMetaSelected: {
    color: theme.colors.brandStrong,
  },
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
  messagesPanel: {
    flex: 1,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  messagesContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
    textAlign: 'center',
  },
  refreshingText: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    textAlign: 'center',
  },
  composerCard: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  composerInput: {
    minHeight: 104,
  },
  composerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
});
