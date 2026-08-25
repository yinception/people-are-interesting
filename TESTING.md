# Testing Guide

## Stack

- Test runner: Jest
- Expo integration: jest-expo preset
- Language: TypeScript tests

## Commands

- `npm test`
- `npm run test:watch`
- `npm run test:coverage`

## Current Coverage Focus

These tests currently cover core local-first v1 data flows:

- CSV parsing/formatting helpers
- Repository shared utilities
- People repository flows (create, list, update, delete)
- Notes repository flows (create, list, update, delete)
- Relationships repository flows (create/update pair behavior, list, delete)
- Search repository behavior
- Settings repository behavior
- Import/export repository flows and validation

## CI

GitHub Actions workflow: `.github/workflows/tests.yml`

It runs:

1. `npm ci`
2. `npx tsc --noEmit`
3. `npm test -- --runInBand`

## Extending Tests

Recommended next additions:

- Model-level hook tests for `usePeopleScreenModel` state transitions.
- Component tests for key user interaction paths (People list, Person detail, Settings modal).
- End-to-end smoke tests for import/export flows on Android dev build.
