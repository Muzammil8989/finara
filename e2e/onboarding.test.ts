import { device, element, by, expect as detoxExpect } from 'detox';

describe('Onboarding', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('shows onboarding screen on first launch', async () => {
    await detoxExpect(element(by.text('Get Started'))).toBeVisible();
  });

  it('completes onboarding and lands on dashboard', async () => {
    await element(by.id('name-input')).typeText('Test User');
    await element(by.text('Get Started')).tap();
    await detoxExpect(element(by.text('Overview'))).toBeVisible();
  });
});
