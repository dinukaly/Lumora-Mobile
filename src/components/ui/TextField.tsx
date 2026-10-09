import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { theme } from '@/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  accessory?: ReactNode;
};

export function TextField({
  label,
  error,
  hint,
  accessory,
  style,
  ...inputProps
}: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {accessory}
      </View>
      <TextInput
        accessibilityHint={inputProps.accessibilityHint ?? error ?? hint}
        accessibilityLabel={inputProps.accessibilityLabel ?? label}
        placeholderTextColor={theme.colors.textSoft}
        selectionColor={theme.colors.brand}
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.typeScale.label.fontSize,
    lineHeight: theme.typeScale.label.lineHeight,
    fontWeight: '600',
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceElevated,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  error: {
    color: theme.colors.danger,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  hint: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
});
