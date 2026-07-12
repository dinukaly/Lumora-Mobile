import type { PropsWithChildren, ReactNode } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { theme } from '@/theme';

type ScreenProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  scrollable?: boolean;
  headerRight?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function Screen({
  children,
  title,
  subtitle,
  scrollable = true,
  headerRight,
  refreshing = false,
  onRefresh,
}: ScreenProps) {
  const content = (
    <View style={styles.content}>
      {(title || subtitle || headerRight) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
        </View>
      )}
      <View style={[styles.body, !scrollable ? styles.bodyFill : null]}>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.brand}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing['3xl'],
    gap: theme.layout.sectionGap,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  headerRight: {
    paddingTop: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typeScale.heading.fontSize,
    lineHeight: theme.typeScale.heading.lineHeight,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  body: {
    flexGrow: 1,
    gap: theme.layout.sectionGap,
  },
  bodyFill: {
    flex: 1,
  },
});
