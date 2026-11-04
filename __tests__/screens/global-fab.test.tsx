const mockSegments = jest.fn();
jest.mock('expo-router', () => ({ useSegments: () => mockSegments() }));

import { GlobalFab } from '@/components/layouts/global-fab';
import { ModalProvider } from '@/providers/modal-context';
import { lightColors } from '@/theme/colors';
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

const renderFab = (segments: string[]) => {
  mockSegments.mockReturnValue(segments);
  return render(<SafeAreaProvider initialMetrics={METRICS}><ModalProvider><GlobalFab /></ModalProvider></SafeAreaProvider>);
};

describe('GlobalFab', () => {
  it.each([
    [['(tabs)'], 'Add transaction'],
    [['(tabs)', 'transactions'], 'Add transaction'],
    [['(tabs)', 'budget'], 'Add budget'],
    [['(tabs)', 'savings'], 'Add savings goal'],
  ])('on %j shows a visible, labelled teal button', (segments, label) => {
    renderFab(segments);
    const fab = screen.getByTestId('global-fab');
    expect(fab.props.accessibilityLabel).toBe(label);
    const style = StyleSheet.flatten(fab.props.style);
    // Light theme: a solid fill and a real size, so the white "+" is never on paper.
    expect(style.backgroundColor).toBe(lightColors.btnPrimaryBg);
    expect(style.width).toBe(56);
    expect(style.height).toBe(56);
  });

  it('is hidden on Insights', () => {
    renderFab(['(tabs)', 'reports']);
    expect(screen.queryByTestId('global-fab')).toBeNull();
  });
});
