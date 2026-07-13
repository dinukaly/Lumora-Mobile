import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

type InlineNoticeTone = 'info' | 'warning' | 'error' | 'success';

type InlineNoticeProps = {
  message: string;
  tone?: InlineNoticeTone;
};

const toneStyles: Record<
  InlineNoticeTone,
  { backgroundColor: string; borderColor: string; textColor: string }
> = {
  info: {
    backgroundColor: theme.colors.brandSoft,
    borderColor: theme.colors.brand,
    textColor: theme.colors.brandStrong,
  },
  warning: {
    backgroundColor: theme.colors.warningSoft,
    borderColor: theme.colors.warning,
    textColor: '#7C2D12',
  },
  error: {
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.danger,
    textColor: '#7F1D1D',
  },
  success: {
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.success,
    textColor: '#14532D',
  },
};

export function InlineNotice({
  message,
  tone = 'warning',
}: InlineNoticeProps) {
  const palette = toneStyles[tone];

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.container,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: palette.textColor,
          },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  text: {
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
});
