import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useGetNotificationsQuery } from '@/api/notificationsApi';
import type { NotificationItem } from '@/api/notificationsApi';
import { useGetProgressQuery } from '@/api/progressApi';
import { NotificationRow, StatCard } from '@/components/dashboard';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  InlineNotice,
  Screen,
} from '@/components/ui';
import { useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const hasActiveSession = Boolean(isAuthenticated && accessToken);
  const {
    data: progress,
    error: progressError,
    isLoading: progressLoading,
    isFetching: progressFetching,
    refetch: refetchProgress,
  } = useGetProgressQuery(undefined, { skip: !hasActiveSession });
  const {
    data: notificationsResponse,
    error: notificationsError,
    isLoading: notificationsLoading,
    isFetching: notificationsFetching,
    refetch: refetchNotifications,
  } = useGetNotificationsQuery({ limit: 5 }, { skip: !hasActiveSession });

  const refreshing = progressFetching || notificationsFetching;
  const notifications = notificationsResponse?.notifications ?? [];
  const unreadCount = notificationsResponse?.unreadCount ?? 0;
  const hasPrimaryError = !progress && !notificationsResponse;

  function handleRefresh() {
    if (!hasActiveSession) {
      return;
    }

    void refetchProgress();
    void refetchNotifications();
  }

  function handleNotificationPress(item: NotificationItem) {
    if (item.metadata?.documentId) {
      router.push({
        pathname: '/document/[id]',
        params: { id: item.metadata.documentId },
      });
      return;
    }

    router.push('/notifications');
  }

  return (
    <Screen
      title={`Hello${user?.name ? `, ${user.name}` : ''}`}
      subtitle="Here is your current study momentum and the latest learning activity."
      refreshing={refreshing}
      onRefresh={handleRefresh}
      headerRight={
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/notifications')}
          style={({ pressed }) => [
            styles.headerButton,
            pressed ? styles.headerButtonPressed : null,
          ]}
        >
          <Text style={styles.headerButtonText}>Inbox</Text>
          {unreadCount > 0 ? (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      }
    >
      {hasPrimaryError ? (
        <ErrorState
          title="Dashboard unavailable"
          description="We could not load your progress or recent notifications."
          onRetry={handleRefresh}
        />
      ) : null}

      <View style={styles.quickActions}>
        <Button
          variant="secondary"
          onPress={() => router.push('/(tabs)/documents')}
        >
          Upload
        </Button>
        <Button
          variant="secondary"
          onPress={() => router.push('/(tabs)/flashcards')}
        >
          Review
        </Button>
        <Button
          variant="secondary"
          onPress={() => router.push('/(tabs)/quizzes')}
        >
          Quiz
        </Button>
      </View>

      {progressLoading && !progress ? (
        <View style={styles.statsGrid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <View style={styles.statSkeletonTop} />
              <View style={styles.statSkeletonValue} />
              <View style={styles.statSkeletonBottom} />
            </Card>
          ))}
        </View>
      ) : progress ? (
        <View style={styles.statsGrid}>
          <StatCard
            label="Documents Ready"
            value={progress.documentsReady}
            caption={`${progress.totalDocuments} total documents`}
            accentColor={theme.colors.brand}
            accentSoftColor={theme.colors.brandSoft}
          />
          <StatCard
            label="Flashcards Due"
            value={progress.flashcardsDue}
            caption={`${progress.flashcardsReviewed} reviewed so far`}
            accentColor={theme.colors.warning}
            accentSoftColor={theme.colors.warningSoft}
          />
          <StatCard
            label="Quizzes Completed"
            value={progress.quizzesCompleted}
            caption={`${progress.totalQuizzes} quizzes available`}
            accentColor={theme.colors.info}
            accentSoftColor={theme.colors.infoSoft}
          />
          <StatCard
            label="Average Quiz Score"
            value={`${Math.round(progress.averageQuizScore)}%`}
            caption={`${progress.totalChatMessages} chat messages asked`}
            accentColor={theme.colors.success}
            accentSoftColor={theme.colors.successSoft}
          />
        </View>
      ) : null}

      <Card
        title="Recent notifications"
        description="Stay on top of document processing and new study material."
      >
        {notificationsLoading && !notifications.length ? (
          <View style={styles.notificationList}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={index} style={styles.notificationSkeletonRow}>
                <View style={styles.notificationSkeletonDot} />
                <View style={styles.notificationSkeletonContent}>
                  <View style={styles.notificationSkeletonTitle} />
                  <View style={styles.notificationSkeletonBody} />
                </View>
              </View>
            ))}
          </View>
        ) : notificationsError && !notifications.length ? (
          <ErrorState
            title="Notifications unavailable"
            description="We could not load your recent notifications right now."
            onRetry={() => void refetchNotifications()}
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            eyebrow="All caught up"
            title="No recent notifications"
            description="Processing updates and generated study items will appear here."
            actionLabel="Open documents"
            onAction={() => router.push('/(tabs)/documents')}
          />
        ) : (
          <View style={styles.notificationList}>
            {notifications.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onPress={handleNotificationPress}
              />
            ))}
          </View>
        )}
      </Card>

      {progressError && progress ? (
        <InlineNotice message="Progress is showing cached data. Pull to refresh and try again." />
      ) : null}

      {notificationsError && notifications.length > 0 ? (
        <InlineNotice message="Recent notifications may be stale. Pull to refresh and try again." />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    minHeight: theme.layout.touchTarget,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerButtonPressed: {
    opacity: 0.84,
  },
  headerButtonText: {
    color: theme.colors.text,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    fontWeight: '700',
  },
  headerBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 12,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statsGrid: {
    gap: theme.spacing.lg,
  },
  statSkeletonTop: {
    width: 84,
    height: 14,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  statSkeletonValue: {
    width: 120,
    height: 38,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  statSkeletonBottom: {
    width: 150,
    height: 14,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  notificationList: {
    gap: theme.spacing.xs,
  },
  notificationSkeletonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  notificationSkeletonDot: {
    width: 10,
    height: 10,
    marginTop: 8,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfaceSoft,
  },
  notificationSkeletonContent: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  notificationSkeletonTitle: {
    width: '60%',
    height: 14,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  notificationSkeletonBody: {
    width: '92%',
    height: 12,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
});
