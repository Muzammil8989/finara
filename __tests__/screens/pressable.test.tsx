import { Pressable } from '@/components/common/pressable';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

// NativeWind drops style *functions* on device, so the wrapper must always
// hand React Native a plain style object. Assert on the rendered element.
describe('Pressable wrapper', () => {
  const styleFn = ({ pressed }: { pressed: boolean }) => ({ width: 56, backgroundColor: pressed ? 'red' : 'teal' });
  const rendered = (utils: ReturnType<typeof render>) => StyleSheet.flatten(utils.getByTestId('p').props.style);

  it('applies the style returned by a style function', () => {
    const utils = render(<Pressable testID="p" style={styleFn} />);
    expect(rendered(utils)).toMatchObject({ width: 56, backgroundColor: 'teal' });
  });

  it('switches to the pressed style while pressed and back after', () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    const utils = render(<Pressable testID="p" style={styleFn} onPressIn={onPressIn} onPressOut={onPressOut} />);
    act(() => { fireEvent(utils.getByTestId('p'), 'pressIn'); });
    expect(rendered(utils).backgroundColor).toBe('red');
    expect(onPressIn).toHaveBeenCalled();
    act(() => { fireEvent(utils.getByTestId('p'), 'pressOut'); });
    expect(rendered(utils).backgroundColor).toBe('teal');
    expect(onPressOut).toHaveBeenCalled();
  });

  it('passes plain styles through', () => {
    const utils = render(<Pressable testID="p" style={{ height: 10 }} />);
    expect(rendered(utils)).toMatchObject({ height: 10 });
  });
});
