import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { syncInitialTheme, useAppTheme } from '../engine/colors';
import * as Sentry from '@sentry/react-native';

try {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
    debug: true,
    tracesSampleRate: 1.0,
  });
} catch (e) {
  console.warn('Sentry init failed:', e);
}

function RootNavigator() {
  const { isDark } = useAppTheme();

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200 }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="genesis" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="session-restore" />
          <Stack.Screen name="living-world" />
        </Stack>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    syncInitialTheme();
  }, []);

  return <RootNavigator />;
}
