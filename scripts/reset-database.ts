/**
 * Database Reset Utility
 * Run this script to completely reset your database to fresh state
 *
 * Usage:
 * 1. Stop your Expo development server
 * 2. Delete the database file manually:
 *    - iOS Simulator: ~/Library/Developer/CoreSimulator/Devices/[DEVICE_ID]/data/Containers/Data/Application/[APP_ID]/Library/LocalDatabase/wealthflow.db
 *    - Android Emulator: /data/data/[PACKAGE_NAME]/databases/wealthflow.db
 *    - Or use the app's internal reset (recommended)
 * 3. Restart the app - it will recreate everything from scratch
 *
 * For easier reset during development:
 * - Change DATABASE_VERSION in migrations.ts to a lower number
 * - The app will automatically detect and reset the database
 */

console.log(`
========================================
DATABASE RESET INSTRUCTIONS
========================================

To reset your database:

OPTION 1 - Automatic Reset (Recommended):
1. The database version has been changed from 4 to 1
2. Simply restart your Expo app
3. The app will detect the version mismatch and automatically reset
4. All tables will be recreated with fresh data

OPTION 2 - Manual File Deletion:
1. Stop your Expo development server (Ctrl+C)
2. Run: npx expo start -c (clear cache)
3. Delete these folders to clear all app data:
   - iOS: Delete app from simulator and reinstall
   - Android: Settings > Apps > [Your App] > Clear Data

OPTION 3 - Use Expo Client:
1. In Expo Go/dev client, shake device
2. Select "Clear AsyncStorage and reload"
3. Or uninstall and reinstall the app

The database will be recreated with:
- All default categories (with correct icons)
- 6 payment methods (Cash, Bank, Credit, Debit, Mobile Wallet, Savings)
- Clean schema with proper indexes

========================================
`);
