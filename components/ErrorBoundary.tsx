import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: string | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message || error.toString() };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('❌ App Crash:', error.message);
    console.error('Stack:', info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>❌ Unexpected Error</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.error}>{this.state.error}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0014', padding: 20 },
  title: { color: '#FF6B6B', fontSize: 20, fontWeight: '700', marginBottom: 20 },
  scroll: { maxHeight: '80%', width: '100%' },
  error: { color: '#E8E0F0', fontSize: 14, lineHeight: 22 },
});
