import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '../components/ErrorBoundary';
import SideMenu from '../components/SideMenu';
import { useTwinStore } from '../store/useTwinStore';
import { Stack } from 'expo-router';

/**
 * ROOT LAYOUT — الهيكل الرئيسي
 * =================================
 * لا يحتوي على أي شاشات قديمة.
 * فقط LivingSpace عبر index.tsx.
 * المظهر والإطار مستقران حتى الإصدار 1.0.
 */

export default function RootLayout() {
  const theme = useTwinStore(s => s.theme);
  const isDark = theme === 'dark';
  const menuVisible = useTwinStore(s => s.menuVisible);
  const closeMenu = useTwinStore(s => s.closeMenu);

  const handleCloseMenu = () => {
    if (typeof closeMenu === 'function') closeMenu();
  };

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <SideMenu visible={menuVisible} onClose={handleCloseMenu}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              animationDuration: 150,
              contentStyle: {
                backgroundColor: isDark ? '#0A0014' : '#FAFAF8',
              },
            }}
          >
            <Stack.Screen name="index" />
          </Stack>
        </SideMenu>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
