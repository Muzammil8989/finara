import { IntroCarousel } from '@/features/onboarding/components/intro-carousel';
import { renderWithProviders } from '@/tests/helpers/render-with-providers';
import { act, fireEvent, screen } from '@testing-library/react-native';
import React from 'react';

// Jest has no layout engine: give the pager a phone-sized layout so pages render.
const layoutPager = () => act(() => {
  fireEvent(screen.getByTestId('intro-pager'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 600 } } });
});

describe('IntroCarousel', () => {
  it('shows the first page and lets the user skip', async () => {
    const onDone = jest.fn();
    await renderWithProviders(<IntroCarousel onDone={onDone} />);
    layoutPager();
    expect(screen.getByText(/Every amount,/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Skip introduction'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('has a page tab for each of the four pages', async () => {
    await renderWithProviders(<IntroCarousel onDone={jest.fn()} />);
    layoutPager();
    for (const name of ['Track', 'Budget', 'Save', 'Report']) {
      expect(screen.getByLabelText(new RegExp(`: ${name}$`))).toBeTruthy();
    }
  });

  it('Next walks through the pages to Get started, which finishes', async () => {
    const onDone = jest.fn();
    await renderWithProviders(<IntroCarousel onDone={onDone} />);
    layoutPager();
    for (let i = 0; i < 3; i++) fireEvent.press(screen.getByText('Next'));
    expect(screen.queryByLabelText('Skip introduction')).toBeNull();
    fireEvent.press(screen.getByText('Get started'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
