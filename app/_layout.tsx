import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '../components/ErrorBoundary';
import SideMenu from '../components/SideMenu';
import { useTwinStore } from '../store/useTwinStore';
import { Stack } from 'expo-router';

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
            <Stack.Screen name="genesis" options={{ headerShown: false }} />
            <Stack.Screen name="session-restore" options={{ headerShown: false }} />
            <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
          </Stack>
        </SideMenu>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
