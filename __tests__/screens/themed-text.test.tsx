import { ThemedText } from '@/components/common';
import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

const styleOf = (el: React.ReactElement) => {
  const { getByText } = render(el);
  return StyleSheet.flatten(getByText('x').props.style);
};

describe('ThemedText weights', () => {
  it('turns a weight class into the matching font file instead of faux-bold', () => {
    expect(styleOf(<ThemedText className="font-bold">x</ThemedText>).fontFamily).toBe('PlusJakartaSans_700Bold');
    expect(styleOf(<ThemedText className="text-sm font-semibold">x</ThemedText>).fontFamily).toBe('PlusJakartaSans_600SemiBold');
  });

  it('keeps serif headlines serif and figures in the numeral face', () => {
    expect(styleOf(<ThemedText type="headline" className="font-bold">x</ThemedText>).fontFamily).toBe('PlayfairDisplay_700Bold');
    expect(styleOf(<ThemedText type="figure" className="font-bold">x</ThemedText>).fontFamily).toBe('SpaceGrotesk_700Bold');
  });

  it('uses the type default when no weight class is given', () => {
    expect(styleOf(<ThemedText type="kicker">x</ThemedText>).fontFamily).toBe('PlusJakartaSans_700Bold');
    expect(styleOf(<ThemedText>x</ThemedText>).fontFamily).toBe('PlusJakartaSans_400Regular');
  });

  it('lets an explicit style fontFamily win', () => {
    expect(styleOf(<ThemedText className="font-bold" style={{ fontFamily: 'Custom' }}>x</ThemedText>).fontFamily).toBe('Custom');
  });

  it('figures use tabular numerals', () => {
    expect(styleOf(<ThemedText type="figure">x</ThemedText>).fontVariant).toEqual(['tabular-nums']);
  });
});
