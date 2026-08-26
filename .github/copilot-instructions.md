# Copilot Instructions

## Priority Rules

1. Follow Expo SDK 57 behavior first.
2. Keep v1 local-first (SQLite, no backend, no auth).
3. Preserve cross-platform code while Android is the active test target.
4. Prefer simple, strict TypeScript implementations over clever abstractions.

## Authoritative Reference

- Always use the Expo SDK 57 docs before writing or changing Expo-related code:
  https://docs.expo.dev/versions/v57.0.0/
- Do not use newer-SDK API assumptions.

## Product Context

People Are Interesting is a mobile app for capturing notes about people, viewing notes as a per-person timeline, and linking relationships between people.

### V1 Scope

- Add people.
- Add notes on people.
- Add relationships between people using free-text relationship labels, stored per direction.
- Search by people.name and notes.content keywords.
- People list shows most recent note preview per person.
- Person detail shows notes newest-first; tapping a note reveals full timestamp.

### V2 Direction (Not Started)

- Migrate from local-only to cloud backend.
- Add accounts/login.
- Supabase is a preferred target.

## Technical Constraints

- Stack: Expo managed workflow + React Native + TypeScript.
- Data layer for v1: expo-sqlite.
- Build/deploy: EAS Build.
- Development runtime: custom dev build via expo-dev-client (not Expo Go).
- Primary testing target: Android device.
- iOS runtime testing is deferred, but code must remain cross-platform.

## Do and Don’t

### Do

- Use functional components and hooks.
- Keep TypeScript strict-friendly.
- Use expo install for Expo ecosystem packages.
- Minimize dependency additions.
- Keep configuration stable unless a task explicitly requires changes.

### Don’t

- Don’t introduce backend/auth patterns into v1 tasks unless explicitly requested.
- Don’t rely on Expo SDK >57 APIs.
- Don’t duplicate relationship rows in both directions.
- Don’t denormalize "latest note summary" into a stored column.

## SQLite Source of Truth

```sql
CREATE TABLE people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
);

CREATE TABLE relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id_a INTEGER NOT NULL,
  person_id_b INTEGER NOT NULL,
  relationship_type TEXT,
  reverse_relationship_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (person_id_a) REFERENCES people(id) ON DELETE CASCADE,
  FOREIGN KEY (person_id_b) REFERENCES people(id) ON DELETE CASCADE
);

CREATE INDEX idx_notes_person_id ON notes(person_id);
CREATE INDEX idx_relationships_a ON relationships(person_id_a);
CREATE INDEX idx_relationships_b ON relationships(person_id_b);
```

## Query and Data Notes

- Relationship is one row per pair.
- `relationship_type` describes person_id_b relative to person_id_a.
- `reverse_relationship_type` describes person_id_a relative to person_id_b.
- Both relationship labels are optional and swap together whenever pair order is normalized.
- Each direction is stored independently, so one-way labels are valid.
- Latest-note summary is computed with ORDER BY created_at DESC LIMIT 1.
- V1 search uses LIKE on people.name and notes.content.
- Timestamps are stored as ISO 8601 text.
- FTS5 is a future optimization option if needed.

## Repo Pointers

- App entry: App.tsx
- Expo config: app.json
- EAS config: eas.json
- Module entry: index.ts

## Commands

- npm run start
- npm run android
- npm run ios
- npm run web

## Current Delivery Status

- App scaffolded from create-expo-app (blank TypeScript template).
- Android dev build is running.
- Schema is designed and ready to implement.
- Next milestone: data-access module, then People List screen.
