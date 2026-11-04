#!/usr/bin/env node
/**
 * Run the timezone-sensitive tests once per timezone. TZ must be set before
 * Node starts (Jest sandboxes process.env, so changing it inside a test has
 * no effect). The zones cover west of UTC, UTC, east of UTC, and DST changes.
 */
const { spawnSync } = require('child_process');

const ZONES = ['America/Los_Angeles', 'America/New_York', 'UTC', 'Asia/Karachi', 'Pacific/Auckland'];
const TESTS = [
  '__tests__/lib/date-timezones.test.ts',
  '__tests__/integration/recurring-processor.test.ts',
  '__tests__/integration/reports.test.ts',
  '__tests__/screens/activity.test.tsx',
];

let failed = false;
for (const zone of ZONES) {
  console.log(`\n=== TZ=${zone} ===`);
  const result = spawnSync(process.execPath, [require.resolve('jest/bin/jest'), '--ci', ...TESTS], {
    stdio: 'inherit',
    env: { ...process.env, TZ: zone, EXPECT_TZ: zone },
  });
  if (result.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
