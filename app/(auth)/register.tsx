import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useRegisterMutation } from '@/api/authApi';
import { Button, Card, Screen, TextField } from '@/components/ui';
import { theme } from '@/theme';
import { getApiFormErrorState } from '@/utils/apiErrors';

function validateRegisterForm(name: string, email: string, password: string) {
  const fieldErrors: Record<string, string> = {};

  if (!name.trim()) {
    fieldErrors.name = 'Name is required.';
  }

  if (!email.trim()) {
    fieldErrors.email = 'Email is required.';
  } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
    fieldErrors.email = 'Enter a valid email address.';
  }

  if (!password) {
    fieldErrors.password = 'Password is required.';
  } else if (password.length < 8) {
    fieldErrors.password = 'Password must be at least 8 characters.';
  }

  return fieldErrors;
}

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [register, { isLoading, isSuccess, data }] = useRegisterMutation();

  useEffect(() => {
    if (isSuccess) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isSuccess, router]);

  async function handleSubmit() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const nextFieldErrors = validateRegisterForm(
      trimmedName,
      trimmedEmail,
      password,
    );

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
      await register({
        name: trimmedName,
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Start turning PDFs into grounded summaries, questions, quizzes, and flashcards.
            </Text>
          </View>

          <View style={styles.form}>
            {formError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            ) : null}

            {data?.message ? (
              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerText}>{data.message}</Text>
              </View>
            ) : null}

            <TextField
              label="Name"
              value={name}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="name"
              onChangeText={(value) => {
                setName(value);
                clearFieldError('name');
              }}
              placeholder="Jane Learner"
              error={fieldErrors.name}
            />

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
              autoComplete="new-password"
              textContentType="newPassword"
              secureTextEntry
              onChangeText={(value) => {
                setPassword(value);
                clearFieldError('password');
              }}
              placeholder="Minimum 8 characters"
              hint="Use at least 8 characters."
              error={fieldErrors.password}
            />

            <Button fullWidth size="lg" loading={isLoading} onPress={handleSubmit}>
              Create account
            </Button>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <Pressable accessibilityRole="link">
                <Text style={styles.footerLink}>Sign in</Text>
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
    fontSize: theme.typeScale.heading.fontSize,
    lineHeight: theme.typeScale.heading.lineHeight,
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
  infoBanner: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  infoBannerText: {
    color: theme.colors.textMuted,
    fontSize: theme.typeScale.bodySmall.fontSize,
    lineHeight: theme.typeScale.bodySmall.lineHeight,
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
});
