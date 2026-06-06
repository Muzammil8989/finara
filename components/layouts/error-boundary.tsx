/**
 * ErrorBoundary — catches render errors and shows a fallback UI.
 *
 * Architecture:
 *   ErrorBoundary  (class component — required for getDerivedStateFromError)
 *   └── ErrorFallback (functional component — uses hooks, NativeWind tokens, ThemedText)
 *
 * Design tokens used in ErrorFallback:
 *   background   → bg-background / dark:bg-dark-background
 *   icon surface → bg-errorBg / dark:bg-dark-errorBg        (M3 error-container)
 *   icon color   → text-errorText / dark:text-dark-errorText (M3 on-error-container)
 *   headline     → text-textPrimary / dark:text-dark-textPrimary
 *   body         → text-textMuted / dark:text-dark-textMuted
 *   CTA bg       → bg-primary                               (M3 primary)
 *   CTA text     → text-white                               (M3 on-primary)
 *   CTA shape    → rounded-2xl = Shape.Large (16dp)
 */

import React, { Component, ErrorInfo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/common';
import { logger } from '@/lib/logger';

// ─── ErrorFallback ────────────────────────────────────────────────────────────
// Functional component — can use NativeWind + ThemedText for full token coverage
// and dark mode support.

interface ErrorFallbackProps {
  onReset: () => void;
  error: Error | null;
  componentStack: string | null;
}

function ErrorFallback({ onReset, error, componentStack }: ErrorFallbackProps) {
  const message = error?.message ?? 'Unknown error';
  const stack = error?.stack ?? '';

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        <View className="items-center mt-8 mb-4">
          <View className="w-16 h-16 rounded-2xl bg-errorBg dark:bg-dark-errorBg items-center justify-center mb-4">
            <ThemedText className="text-3xl text-errorText dark:text-dark-errorText">
              !
            </ThemedText>
          </View>
          <ThemedText
            type="subtitle"
            className="text-center text-textPrimary dark:text-dark-textPrimary mb-2"
          >
            Something went wrong
          </ThemedText>
        </View>

        <View className="bg-errorBg dark:bg-dark-errorBg rounded-2xl p-4 mb-4">
          <ThemedText className="text-xs font-bold text-errorText dark:text-dark-errorText mb-1">
            ERROR MESSAGE
          </ThemedText>
          <ThemedText className="text-sm text-errorText dark:text-dark-errorText" selectable>
            {message}
          </ThemedText>
        </View>

        {stack ? (
          <View className="bg-surface dark:bg-dark-surface rounded-2xl p-4 mb-4">
            <ThemedText className="text-xs font-bold text-textMuted dark:text-dark-textMuted mb-1">
              STACK TRACE
            </ThemedText>
            <ThemedText
              className="text-xs text-textPrimary dark:text-dark-textPrimary"
              selectable
            >
              {stack.split('\n').slice(0, 12).join('\n')}
            </ThemedText>
          </View>
        ) : null}

        {componentStack ? (
          <View className="bg-surface dark:bg-dark-surface rounded-2xl p-4 mb-4">
            <ThemedText className="text-xs font-bold text-textMuted dark:text-dark-textMuted mb-1">
              COMPONENT STACK
            </ThemedText>
            <ThemedText
              className="text-xs text-textPrimary dark:text-dark-textPrimary"
              selectable
            >
              {componentStack.split('\n').slice(0, 12).join('\n')}
            </ThemedText>
          </View>
        ) : null}

        <Pressable
          onPress={onReset}
          className="bg-primary px-8 py-3.5 rounded-2xl items-center mt-2"
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <ThemedText className="text-white font-bold text-base">
            Try Again
          </ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── ErrorBoundary ────────────────────────────────────────────────────────────
// Class component is required — getDerivedStateFromError cannot be used in
// functional components. All UI is delegated to ErrorFallback.

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
    this.setState({ componentStack: errorInfo.componentStack ?? null });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, componentStack: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorFallback
          onReset={this.handleReset}
          error={this.state.error}
          componentStack={this.state.componentStack}
        />
      );
    }
    return this.props.children;
  }
}
