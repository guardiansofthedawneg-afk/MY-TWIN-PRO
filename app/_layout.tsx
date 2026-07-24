import React, { useEffect } from 'react';
import { View, Text, ScrollView, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { syncInitialTheme, useAppTheme } from '../engine/colors';
import * as ErrorRecovery from 'expo-error-recovery';

const fallbackErrorHandler = (error: Error) => {
  console.error('FATAL ERROR:', error);
  if (__DEV__) {
    console.log('Dev mode: showing error');
  }
};

const globalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
  console.error('Global Error Caught:', error.message);
  fallbackErrorHandler(error);
  if (globalHandler) {
    globalHandler(error, isFatal);
  }
});

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
