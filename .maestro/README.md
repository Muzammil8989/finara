# Maestro E2E Tests

## Installation

**macOS / Linux:**
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Windows (PowerShell):**
```powershell
iwr "https://get.maestro.mobile.dev/install.ps1" | iex
```

## Running Tests

```bash
# Run a single flow
maestro test .maestro/onboarding.yaml

# Run all flows
maestro test .maestro/

# Run on a specific device
maestro test --device <deviceId> .maestro/
```

## Flows

| File | What it tests |
|------|--------------|
| `onboarding.yaml` | First-time setup flow |
| `add-transaction.yaml` | Adding an expense transaction |
| `tab-navigation.yaml` | All 5 tabs are reachable |

## Notes
- App must be running on a simulator/emulator before running flows
- For Android: start with `npx expo run:android`
- For iOS: start with `npx expo run:ios`
