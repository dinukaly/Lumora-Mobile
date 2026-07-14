import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthBootstrapGate } from '@/auth/authBootstrap';
import { AppProviders } from '@/providers/AppProviders';
import { theme } from '@/theme';

export default function RootLayout() {
  return (
    <AppProviders>
      <AuthBootstrapGate>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: theme.colors.background,
              },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="document/[id]" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="verify-email" />
          </Stack>
        </SafeAreaProvider>
      </AuthBootstrapGate>
    </AppProviders>
  );
}
