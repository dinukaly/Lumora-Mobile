import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { theme } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = PropsWithChildren<{
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leftAccessory?: ReactNode;
  onPress?: () => void;
}>;

const variantStyles = {
  primary: {
    backgroundColor: theme.colors.brand,
    borderColor: theme.colors.brand,
    textColor: '#04211D',
  },
  secondary: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    textColor: theme.colors.text,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
    textColor: theme.colors.textMuted,
  },
  danger: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
    textColor: '#FFF7F7',
  },
} as const;

const sizeStyles = {
  sm: {
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
    labelSize: theme.typeScale.bodySmall.fontSize,
  },
  md: {
    minHeight: theme.layout.touchTarget,
    paddingHorizontal: theme.spacing.xl,
    labelSize: theme.typeScale.label.fontSize,
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: theme.spacing['2xl'],
    labelSize: theme.typeScale.body.fontSize,
  },
} as const;

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftAccessory,
  onPress,
}: ButtonProps) {
  const palette = variantStyles[variant];
  const sizing = sizeStyles[size];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: sizing.minHeight,
          paddingHorizontal: sizing.paddingHorizontal,
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: inactive ? 0.45 : pressed ? 0.86 : 1,
          width: fullWidth ? '100%' : undefined,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.textColor} />
      ) : (
        <View style={styles.content}>
          {leftAccessory ? <View style={styles.accessory}>{leftAccessory}</View> : null}
          <Text
            style={[
              styles.label,
              {
                color: palette.textColor,
                fontSize: sizing.labelSize,
              },
            ]}
          >
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  accessory: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
