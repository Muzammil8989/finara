# Contributing to Folio

Thanks for helping improve Folio. This guide explains how to set up the project and how a change gets from your machine into `main`.

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## The rules in short

1. Nobody pushes directly to `main`. Every change goes through a pull request.
2. A pull request can merge only after the CI checks pass (lint, type check and tests).
3. Keep each pull request to one change. Small pull requests are reviewed faster.

## Set up the project

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/<your-username>/folio.git
cd folio
git remote add upstream https://github.com/Muzammil8989/folio.git
nvm use            # Node 24, from .nvmrc
cp .env.example .env
npm install
npm start
```

## Workflow

### 1. Start from an up-to-date `main`

```bash
git checkout main
git pull upstream main
git checkout -b feat/short-description
```

### 2. Name your branch by type

| Prefix | Use for |
| --- | --- |
| `feat/` | A new feature |
| `fix/` | A bug fix |
| `refactor/` | Code changes that do not change behaviour |
| `test/` | Adding or fixing tests |
| `docs/` | Documentation only |
| `chore/` | Tooling, dependencies, CI |

### 3. Write commit messages in Conventional Commits style

```
<type>(<optional scope>): <short summary in the imperative>
```

Examples:

```
feat(budgets): add rollover of unspent budget
fix(auth): lock the app after five wrong PIN attempts
docs: explain the backup file format
```

### 4. Check your work before you push

Run the same checks that CI runs:

```bash
npm run lint
npm run typecheck
npm test
npm run test:tz    # if you touched date or time code
```

Add or update tests for any behaviour you change. Tests live in `__tests__/`, with shared helpers in `tests/`.

### 5. Open a pull request

- Push your branch and open a pull request against `main`.
- Fill in the pull request template, and add screenshots or a short recording for UI changes.
- Link the issue it closes (for example `Closes #12`).
- Reply to review comments and resolve every conversation. Unresolved conversations block the merge.
- Pull requests are squash-merged, so the title becomes the commit message on `main`. Write it in Conventional Commits style.

## Code conventions

- **Routes vs features:** files in `app/` are routes only. They compose components from `features/<domain>/`.
- **Imports:** import feature code by deep path, such as `@/features/loans/hooks/use-loans`. Do not add barrel (`index.ts`) files to feature folders.
- **Shared UI:** reusable components go in `components/common` and are imported from `@/components/common`.
- **Styling:** use NativeWind classes and tokens from `theme/`. Do not hard-code colours.
- **Types:** TypeScript strict mode is on. Avoid `any`; put shared types in `types/`.
- **Data:** database access goes through Drizzle in `lib/db`. Schema changes need a migration.
- **Privacy:** never log or send financial data off the device.

## Reporting bugs and requesting features

Use the [issue templates](https://github.com/Muzammil8989/folio/issues/new/choose). For security problems, do not open a public issue. Follow [SECURITY.md](SECURITY.md) instead.

## For maintainers: protecting `main`

The ruleset in [`.github/rulesets/main-protection.json`](.github/rulesets/main-protection.json) enforces the rules above:

- changes reach `main` only through a pull request
- the `Lint, Type Check & Test` CI check must pass, and the branch must be up to date with `main`
- all review conversations must be resolved
- force pushes and deletion of `main` are blocked

To apply it, use one of these options.

**Option A: GitHub website**

1. Open **Settings → Rules → Rulesets**.
2. Click **New ruleset → Import a ruleset** and choose `.github/rulesets/main-protection.json`.
3. Check that **Enforcement status** is **Active**, then click **Create**.

**Option B: GitHub CLI**

```bash
gh auth login
./scripts/setup-branch-protection.sh
```

Also recommended under **Settings → General → Pull Requests**: allow only **squash merging**, and turn on **Automatically delete head branches**.
