import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { NotificationItem } from '@/api/notificationsApi';
import { theme } from '@/theme';

type NotificationRowProps = {
  item: NotificationItem;
  onPress?: (item: NotificationItem) => void;
};

export function NotificationRow({ item, onPress }: NotificationRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress ? () => onPress(item) : undefined}
      style={({ pressed }) => [
        styles.container,
        pressed ? styles.containerPressed : null,
      ]}
    >
      <View style={styles.dotColumn}>
        <View
          style={[
            styles.dot,
            item.readAt ? styles.dotRead : styles.dotUnread,
          ]}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>
            {item.title}
          </Text>
          <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
        <Text numberOfLines={2} style={styles.body}>
          {item.body}
        </Text>
      </View>
    </Pressable>
  );
}

function formatRelativeTime(value: string) {
  const createdAt = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor((Date.now() - createdAt) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  containerPressed: {
    opacity: 0.8,
  },
  dotColumn: {
    width: 18,
    alignItems: 'center',
    paddingTop: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: theme.radii.pill,
  },
  dotUnread: {
    backgroundColor: theme.colors.brand,
  },
  dotRead: {
    backgroundColor: theme.colors.borderStrong,
  },
  content: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  title: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typeScale.label.fontSize,
    lineHeight: theme.typeScale.label.lineHeight,
    fontWeight: '700',
  },
  time: {
    color: theme.colors.textSoft,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  body: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
});
