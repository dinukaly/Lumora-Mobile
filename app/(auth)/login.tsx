import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useLoginMutation } from '@/api/authApi';
import { Button, Card, Screen, TextField } from '@/components/ui';
import { theme } from '@/theme';
import { getApiFormErrorState } from '@/utils/apiErrors';

function validateLoginForm(email: string, password: string) {
  const fieldErrors: Record<string, string> = {};

  if (!email.trim()) {
    fieldErrors.email = 'Email is required.';
  } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
    fieldErrors.email = 'Enter a valid email address.';
  }

  if (!password) {
    fieldErrors.password = 'Password is required.';
  }

  return fieldErrors;
}

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [login, { isLoading, isSuccess }] = useLoginMutation();

  useEffect(() => {
    if (isSuccess) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isSuccess, router]);

  async function handleSubmit() {
    const trimmedEmail = email.trim();
    const nextFieldErrors = validateLoginForm(trimmedEmail, password);

    setFieldErrors(nextFieldErrors);
    setFormError(
      Object.keys(nextFieldErrors).length > 0
        ? 'Please correct the highlighted fields.'
        : null,
    );

    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    try {
      await login({
        email: trimmedEmail,
        password,
      }).unwrap();
    } catch (error) {
      const nextErrorState = getApiFormErrorState(error);
      setFormError(nextErrorState.formError);
      setFieldErrors(nextErrorState.fieldErrors);
    }
  }

  function clearFieldError(field: string) {
    setFormError(null);
    setFieldErrors((current) => ({
      ...current,
      [field]: '',
    }));
  }

  return (
    <Screen>
      <View style={styles.centered}>
        <Card>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Lumora Mobile</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Welcome back
            </Text>
            <Text style={styles.subtitle}>
              Sign in to continue studying with your documents, quizzes, and flashcards.
            </Text>
          </View>

          <View style={styles.form}>
            {formError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            ) : null}

            <TextField
              label="Email"
              value={email}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              inputMode="email"
              onChangeText={(value) => {
                setEmail(value);
                clearFieldError('email');
              }}
              placeholder="you@example.com"
              error={fieldErrors.email}
            />

            <TextField
              label="Password"
              value={password}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              secureTextEntry
              onChangeText={(value) => {
                setPassword(value);
                clearFieldError('password');
              }}
              placeholder="Enter your password"
              error={fieldErrors.password}
            />

            <Button fullWidth size="lg" loading={isLoading} onPress={handleSubmit}>
              Sign in
            </Button>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>
            <Link href="/(auth)/register" asChild>
              <Pressable accessibilityLabel="Create an account" accessibilityRole="link" style={styles.footerLinkPressable}>
                <Text style={styles.footerLink}>Create one</Text>
              </Pressable>
            </Link>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  hero: {
    gap: theme.spacing.sm,
  },
  eyebrow: {
    color: theme.colors.brand,
    fontSize: theme.typeScale.eyebrow.fontSize,
    lineHeight: theme.typeScale.eyebrow.lineHeight,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: theme.typeScale.eyebrow.letterSpacing,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typeScale.display.fontSize,
    lineHeight: theme.typeScale.display.lineHeight,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.body.fontSize,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  form: {
    gap: theme.spacing.lg,
  },
  errorBanner: {
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.dangerSoft,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  errorBannerText: {
    color: '#7F1D1D',
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  footerText: {
    color: theme.colors.textSoft,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
  },
  footerLink: {
    color: theme.colors.brand,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
    fontWeight: '700',
  },
  footerLinkPressable: {
    minHeight: theme.layout.touchTarget,
    justifyContent: 'center',
  },
});
