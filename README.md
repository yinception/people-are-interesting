# People Are Interesting

People Are Interesting is a local-first mobile app for creating and managing notes about people you meet and know.

The app is built with Expo + React Native + TypeScript and uses SQLite on-device storage (no backend, no auth in v1).

## What The App Does

### 1. People Management
- Add people by name.
- View people in a list with note preview text.
- Sort people by:
  - Name (A-Z, Z-A)
  - Created time (old-new, new-old)
  - Last modified time (old-new, new-old)
- Persist the selected sort option across app restarts.
- Open a person detail view.
- Edit or delete a person.

### 2. Notes Per Person
- Add notes to a selected person.
- View notes in a timeline (newest first).
- Expand note rows to see timestamps.
- Edit notes.
- Delete notes.

### 3. Relationships Between People
- Search and select another person to link.
- Save optional relationship type text (for example: friend, teammate, mentor).
- Re-using the same pair updates the existing relationship instead of creating duplicates.
- View, edit, and delete relationships.

### 4. Search
- Main People search supports matching:
  - `people.name`
  - `notes.content`
- Uses a debounced SQLite query for non-empty terms.
- Shows matched people and matched note counts.

### 5. Data Portability
- Export all local data to CSV.
- Import from CSV and replace local data.
- Import/export includes:
  - People
  - Notes
  - Relationships
  - App settings (for example theme mode)

### 6. App Settings
- Light/dark theme toggle.
- Seed sample data for development.

## Tech Stack
- Expo SDK 57
- React Native
- TypeScript (strict mode)
- expo-sqlite
- NativeWind
- Jest + jest-expo for tests

## Architecture Summary

### Feature Layer
- `src/features/people/PeopleScreen.tsx`
  - Screen-level orchestration: UI state, keyboard behavior, modal flow, import/export triggers.
- `src/features/people/usePeopleScreenModel.ts`
  - Main state/model logic and async operations.
- `src/features/people/view/*`
  - Presentational components and reusable UI pieces.

### Data Layer
- `src/data/db/*`
  - SQLite client, migrations, migration harness, DB constants.
- `src/data/repositories/*`
  - Repository functions for people, notes, relationships, search, settings, import/export.

## Local Database Model

Core tables:
- `people`
- `notes`
- `relationships`
- `app_settings`

Design notes:
- Relationships are stored as one normalized row per person pair.
- Notes include `created_at` and `updated_at` timestamps.
- Search uses `LIKE` against person names and note content.

## Project Scripts

### App
- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`

### Quality
- `npx tsc --noEmit`
- `npm test`
- `npm run test:watch`
- `npm run test:coverage`

### EAS Builds
- Standalone Android APK (internal distribution):
  - `npx eas build --platform android --profile standalone`
- Development client build (internal):
  - `npx eas build --platform android --profile development`

Optional helpers:
- List recent builds:
  - `npx eas build:list --platform android --limit 10`
- Download/install a built artifact from EAS:
  - `npx eas build:run --platform android`

## Testing

Automated tests currently focus on:
- Repository behavior (CRUD and validation)
- CSV parsing and import/export behavior
- Utility functions
- Settings and search repository behavior

See `TESTING.md` for more details.

## Troubleshooting

### Fresh install still shows old local data

On Android, app data can be restored from backup even after uninstall/reinstall when using the same package id.

This project disables Android backup in `app.json` (`expo.android.allowBackup: false`) to avoid unintended SQLite restore behavior.

If you still see unexpected old data:
- Build a new standalone APK after this setting change.
- Uninstall the existing app from device.
- Install the new APK and launch again.

## Current Product Scope (v1)
- Fully local-first on-device operation
- No cloud sync
- No authentication
- Android is the primary runtime target, with cross-platform code maintained

## License

MIT. See `LICENSE`.
