import OnboardingScreen from '@/app/onboarding';
import { IntroService } from '@/features/onboarding/services/intro-service';
import { installInMemorySecureStore } from '@/tests/helpers/secure-store';
import { renderWithProviders } from '@/tests/helpers/render-with-providers';
import { fireEvent, screen } from '@testing-library/react-native';
import React from 'react';

describe('IntroService', () => {
  it('remembers that the intro was seen, until reset', async () => {
    installInMemorySecureStore();
    expect(await IntroService.hasSeen()).toBe(false);
    await IntroService.markSeen();
    expect(await IntroService.hasSeen()).toBe(true);
    await IntroService.reset();
    expect(await IntroService.hasSeen()).toBe(false);
  });
});

describe('Onboarding shows the intro only once', () => {
  const NEW_USER = { profile: { name: '', isOnboarded: false } };

  it('a brand-new user sees the intro, and skipping it is remembered', async () => {
    await renderWithProviders(<OnboardingScreen />, { ...NEW_USER });
    expect(await screen.findByLabelText('Skip introduction')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Skip introduction'));
    expect(await screen.findByText('Get started')).toBeTruthy(); // profile form
    expect(await IntroService.hasSeen()).toBe(true);
  });

  it('reopening the app before finishing setup goes straight to the profile form', async () => {
    await renderWithProviders(<OnboardingScreen />, { ...NEW_USER, secureStore: { folio_intro_seen: '1' } });
    expect(await screen.findByText('Get started')).toBeTruthy();
    expect(screen.queryByLabelText('Skip introduction')).toBeNull();
  });
});
