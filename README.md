<div align="center">

<img src="branding/folio/png/lockup-800w.png" alt="Folio" width="360" />

### Your money, clearly kept.

A private, offline-first personal finance app for iOS, Android and the web, built with Expo and React Native.

[![CI](https://github.com/Muzammil8989/finara/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Muzammil8989/finara/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-0D5C63.svg)](LICENSE)
[![Expo SDK 54](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo)](https://docs.expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](tsconfig.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-B07D1E.svg)](CONTRIBUTING.md)

</div>

---

## Features

- **Transactions:** log income and expenses, with categories and payment methods
- **Accounts:** track balances across cash, bank and card accounts
- **Budgets:** monthly category budgets with progress tracking
- **Savings goals:** set targets and record contributions
- **Loans:** money lent and borrowed, with repayment history
- **Recurring:** scheduled bills and income that post automatically
- **Household:** shared expenses and settlement history
- **Reports:** charts and summaries, exportable to PDF
- **Backup and restore:** export and import your data locally
- **Security:** PIN and biometric app lock, screen-capture protection, private notifications

All data is stored on the device in SQLite. The app does not need an account or a server.

## Tech stack

| Area | Tools |
| --- | --- |
| App | [Expo](https://expo.dev) SDK 54, React Native, React 19, [Expo Router](https://docs.expo.dev/router/introduction/) |
| Styling | [NativeWind](https://www.nativewind.dev/) (Tailwind CSS), design tokens in `theme/` |
| Data | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) with [Drizzle ORM](https://orm.drizzle.team/) |
| Testing | Jest and React Native Testing Library, Detox and Maestro for end-to-end |
| Quality | ESLint, TypeScript strict mode, GitHub Actions CI |

## Getting started

### Prerequisites

- Node.js 24 (see [`.nvmrc`](.nvmrc); run `nvm use` if you use nvm)
- npm
- For native builds: Android Studio or Xcode. See the [Expo environment setup](https://docs.expo.dev/get-started/set-up-your-environment/).

### Install and run

```bash
git clone https://github.com/Muzammil8989/finara.git
cd finara
cp .env.example .env
npm install
npm start
```

Then press `a` for Android, `i` for iOS or `w` for web, or scan the QR code with a development build.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` / `npm run ios` | Build and run a native app |
| `npm run web` | Run in the browser |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler without emitting |
| `npm test` | Run unit and integration tests |
| `npm run test:coverage` | Run tests with a coverage report |
| `npm run test:tz` | Run the date tests in several time zones |
| `npm run test:e2e:android` / `npm run test:e2e:ios` | Run Detox end-to-end tests |
| `npm run test:maestro` | Run Maestro flows |

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
branding/             logo, icons and brand guidelines
__tests__/ tests/     Jest suites and test helpers
```

Domains: accounts, auth, backup, budgets, categories, household, loans, notifications, onboarding, overview, recurring, reports, savings, settings, transactions, user.

Import feature code by deep path (for example `@/features/loans/hooks/use-loans`). Feature folders have no barrel files.

## Contributing

Contributions are welcome. Read the [contributing guide](CONTRIBUTING.md) before you open a pull request. All changes reach `main` through a reviewed pull request with passing CI.

- Report a bug or request a feature: [open an issue](https://github.com/Muzammil8989/finara/issues/new/choose)
- Report a security problem: see [SECURITY.md](SECURITY.md)
- Community standards: [Code of Conduct](CODE_OF_CONDUCT.md)

## Contributors

Thanks to everyone who has contributed to Folio.

<a href="https://github.com/Muzammil8989/finara/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Muzammil8989/finara" alt="Contributors" />
</a>

## License

Released under the [MIT License](LICENSE).
