import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  type NotificationItem,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/api/notificationsApi';
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

const PAGE_SIZE = 100;

export default function NotificationsScreen() {
  const router = useRouter();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetNotificationsQuery({
    unreadOnly,
    page: 1,
    limit: PAGE_SIZE,
  });
  const [markNotificationRead, { isLoading: isMarkingOneRead }] =
    useMarkNotificationReadMutation();
  const [markAllNotificationsRead, { isLoading: isMarkingAllRead }] =
    useMarkAllNotificationsReadMutation();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const totalCount = data?.total ?? 0;

  async function handleMarkAllRead() {
    if (unreadCount === 0) {
      return;
    }

    setActionError(null);

    try {
      await markAllNotificationsRead().unwrap();
    } catch (markAllError) {
      setActionError(
        getApiFormErrorState(markAllError).formError ??
          'We could not mark all notifications as read right now.',
      );
    }
  }

  async function handleMarkOneRead(notificationId: string) {
    setActionError(null);

    try {
      await markNotificationRead(notificationId).unwrap();
    } catch (markReadError) {
      setActionError(
        getApiFormErrorState(markReadError).formError ??
          'We could not mark that notification as read right now.',
      );
    }
  }

  async function handleOpenNotification(notification: NotificationItem) {
    setActionError(null);

    if (!notification.readAt) {
      try {
        await markNotificationRead(notification.id).unwrap();
      } catch (markReadError) {
        setActionError(
          getApiFormErrorState(markReadError).formError ??
            'We could not mark that notification as read, but you can still open it.',
        );
      }
    }

    const target = getNotificationTarget(notification);
    router.push(target);
  }

  function handleRefresh() {
    setActionError(null);
    void refetch();
  }

  return (
    <Screen
      title="Notifications"
      subtitle="Track document processing, generated study tools, and important account updates."
      refreshing={isFetching}
      onRefresh={handleRefresh}
      headerRight={
        <Button
          size="sm"
          variant="ghost"
          onPress={() => router.push('/(tabs)/dashboard')}
        >
          Dashboard
        </Button>
      }
    >
      {actionError ? (
        <View style={styles.inlineAlert}>
          <Text style={styles.inlineAlertText}>{actionError}</Text>
        </View>
      ) : null}

      <Card
        title="Inbox"
        description={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : 'All caught up'
        }
      >
        <View style={styles.summaryRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Unread</Text>
            <Text style={styles.metricValue}>{unreadCount}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total</Text>
            <Text style={styles.metricValue}>{totalCount}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Button
            size="sm"
            variant={unreadOnly ? 'primary' : 'secondary'}
            onPress={() => setUnreadOnly((current) => !current)}
          >
            {unreadOnly ? 'Unread only' : 'Show all'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            loading={isMarkingAllRead}
            disabled={unreadCount === 0}
            onPress={() => void handleMarkAllRead()}
          >
            Mark all read
          </Button>
        </View>
      </Card>

      <Card
        title="Recent activity"
        description="Tap a notification to open the related screen."
      >
        {isLoading && !notifications.length ? (
          <View style={styles.loadingList}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={index} style={styles.loadingRow}>
                <View style={styles.loadingDot} />
                <View style={styles.loadingContent}>
                  <View style={styles.loadingTitle} />
                  <View style={styles.loadingBody} />
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {!isLoading && error && !notifications.length ? (
          <ErrorState
            title="Notifications unavailable"
            description="We could not load your notifications right now."
            onRetry={handleRefresh}
          />
        ) : null}

        {!isLoading && !error && notifications.length === 0 ? (
          <EmptyState
            eyebrow="All caught up"
            title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
            description={
              unreadOnly
                ? 'You have already read every notification in your inbox.'
                : 'Processing updates and generated study tools will appear here.'
            }
            actionLabel={unreadOnly ? 'Show all notifications' : 'Open documents'}
            onAction={
              unreadOnly
                ? () => setUnreadOnly(false)
                : () => router.push('/(tabs)/documents')
            }
          />
        ) : null}

        {!isLoading && !error && notifications.length > 0 ? (
          <View style={styles.notificationList}>
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                isMarkingRead={isMarkingOneRead}
                onOpen={() => void handleOpenNotification(notification)}
                onMarkRead={
                  notification.readAt
                    ? undefined
                    : () => void handleMarkOneRead(notification.id)
                }
              />
            ))}
          </View>
        ) : null}

        {error && notifications.length > 0 ? (
          <InlineNotice message="Your inbox is showing cached notifications. Pull to refresh and try again." />
        ) : null}
      </Card>
    </Screen>
  );
}

function NotificationCard({
  notification,
  isMarkingRead,
  onOpen,
  onMarkRead,
}: {
  notification: NotificationItem;
  isMarkingRead: boolean;
  onOpen: () => void;
  onMarkRead?: () => void;
}) {
  const accentColor = getNotificationAccent(notification.type);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [
        styles.notificationCard,
        pressed ? styles.notificationCardPressed : null,
      ]}
    >
      <View style={styles.notificationTopRow}>
        <View style={styles.notificationTitleBlock}>
          <View style={styles.notificationHeadingRow}>
            <View
              style={[
                styles.notificationDot,
                {
                  backgroundColor: notification.readAt
                    ? theme.colors.borderStrong
                    : accentColor,
                },
              ]}
            />
            <Text numberOfLines={1} style={styles.notificationTitle}>
              {notification.title}
            </Text>
          </View>
          <Text numberOfLines={3} style={styles.notificationBody}>
            {notification.body}
          </Text>
        </View>

        <View style={styles.notificationMeta}>
          <Text style={styles.notificationTime}>
            {formatRelativeTime(notification.createdAt)}
          </Text>
          <Text
            style={[
              styles.notificationStatus,
              notification.readAt ? styles.notificationStatusRead : null,
            ]}
          >
            {notification.readAt ? 'Read' : 'Unread'}
          </Text>
        </View>
      </View>

      <View style={styles.notificationFooter}>
        <Text style={styles.notificationHint}>
          {getNotificationHint(notification)}
        </Text>
        <View style={styles.notificationActions}>
          {onMarkRead ? (
            <Button
              size="sm"
              variant="ghost"
              loading={isMarkingRead}
              onPress={onMarkRead}
            >
              Mark read
            </Button>
          ) : null}
          <Button size="sm" variant="secondary" onPress={onOpen}>
            Open
          </Button>
        </View>
      </View>
    </Pressable>
  );
}

function getNotificationAccent(type: NotificationItem['type']) {
  switch (type) {
    case 'DOCUMENT_READY':
      return theme.colors.success;
    case 'PROCESSING_FAILED':
      return theme.colors.danger;
    case 'FLASHCARDS_READY':
      return theme.colors.warning;
    case 'QUIZ_READY':
      return theme.colors.info;
    default:
      return theme.colors.brand;
  }
}

function getNotificationHint(notification: NotificationItem) {
  const hasDocumentId = typeof notification.metadata?.documentId === 'string';

  switch (notification.type) {
    case 'DOCUMENT_READY':
      return hasDocumentId
        ? 'Open the document overview to start studying.'
        : 'Open the related document to continue.';
    case 'PROCESSING_FAILED':
      return hasDocumentId
        ? 'Open the document overview to inspect the processing error.'
        : 'Open your dashboard for more details.';
    case 'FLASHCARDS_READY':
      return hasDocumentId
        ? 'Open document flashcards to review the new deck.'
        : 'Open the flashcards tab to study.';
    case 'QUIZ_READY':
      return hasDocumentId
        ? 'Open document quizzes to take the new quiz.'
        : 'Open the quizzes tab to start practicing.';
    default:
      return 'Open for more details.';
  }
}

function getNotificationTarget(notification: NotificationItem) {
  const documentId =
    typeof notification.metadata?.documentId === 'string'
      ? notification.metadata.documentId
      : null;

  if (documentId) {
    if (notification.type === 'FLASHCARDS_READY') {
      return {
        pathname: '/document/[id]/flashcards' as const,
        params: { id: documentId },
      };
    }

    if (notification.type === 'QUIZ_READY') {
      return {
        pathname: '/document/[id]/quizzes' as const,
        params: { id: documentId },
      };
    }

    return {
      pathname: '/document/[id]' as const,
      params: { id: documentId },
    };
  }

  if (notification.type === 'FLASHCARDS_READY') {
    return '/(tabs)/flashcards';
  }

  if (notification.type === 'QUIZ_READY') {
    return '/(tabs)/quizzes';
  }

  return '/(tabs)/dashboard';
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return 'Just now';
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

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
  summaryRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
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
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  loadingList: {
    gap: theme.spacing.lg,
  },
  loadingRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  loadingDot: {
    width: 12,
    height: 12,
    marginTop: 6,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfaceSoft,
  },
  loadingContent: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  loadingTitle: {
    width: '42%',
    height: 14,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  loadingBody: {
    width: '100%',
    height: 34,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  notificationList: {
    gap: theme.spacing.md,
  },
  notificationCard: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  notificationCardPressed: {
    opacity: 0.88,
  },
  notificationTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  notificationTitleBlock: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  notificationHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  notificationDot: {
    width: 10,
    height: 10,
    borderRadius: theme.radii.pill,
  },
  notificationTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typeScale.label.fontSize,
    lineHeight: theme.typeScale.label.lineHeight,
    fontWeight: '700',
  },
  notificationBody: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  notificationMeta: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  notificationTime: {
    color: theme.colors.textSoft,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  notificationStatus: {
    color: theme.colors.brand,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  notificationStatusRead: {
    color: theme.colors.textSoft,
  },
  notificationFooter: {
    gap: theme.spacing.md,
  },
  notificationHint: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  notificationActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
});
