# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Project structure

```
app/                  Expo Router routes only (screens compose feature components)
features/<domain>/    Everything owned by one domain:
  components/           UI used by that domain's screens
  hooks/                data hooks (use-budgets, use-loans, ...)
  services/ context/    domain services and providers
  utils.ts              pure helpers for the domain
components/
  common/             shared UI kit, imported via `@/components/common`
  layouts/            app shell: tab bar, FAB, lock screen, error boundary
hooks/                cross-cutting hooks (color scheme, theme colors)
providers/            app-wide providers (modal state)
lib/                  db (Drizzle/SQLite), utils, logger, toast
theme/                design tokens (colors, typography, spacing, shadows)
types/                shared TypeScript types
__tests__/ tests/     Jest suites and test helpers
```

Domains: accounts, auth, backup, budgets, categories, household, loans, notifications, onboarding, overview, recurring, reports, savings, settings, transactions, user.

Import feature code by deep path (e.g. `@/features/loans/hooks/use-loans`); feature folders have no barrel files.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
