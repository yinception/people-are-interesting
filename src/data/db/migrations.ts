import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from './client';
import {
  ADD_NOTE_UPDATED_AT_COLUMN_SQL,
  ADD_RELATIONSHIP_REVERSE_TYPE_COLUMN_SQL,
  BACKFILL_NOTE_UPDATED_AT_SQL,
  CREATE_APP_SETTINGS_TABLE_SQL,
  CREATE_UNIQUE_RELATIONSHIP_PAIR_INDEX_SQL,
  CREATE_V1_SCHEMA_SQL,
  DEDUPE_RELATIONSHIPS_SQL,
  DELETE_SELF_RELATIONSHIPS_SQL,
  NORMALIZE_RELATIONSHIP_DIRECTION_SQL,
  PRAGMA_FOREIGN_KEYS_ON_SQL,
  PRAGMA_JOURNAL_MODE_WAL_SQL,
} from './sqlConstants';

type MigrationFn = (db: SQLiteDatabase) => Promise<void>;

interface MigrationStep {
  version: number;
  up: MigrationFn;
}

const migrationSteps: MigrationStep[] = [
  {
    version: 1,
    up: migrateToV1,
  },
  {
    version: 2,
    up: migrateToV2,
  },
  {
    version: 3,
    up: migrateToV3,
  },
  {
    version: 4,
    up: migrateToV4,
  },
  {
    version: 5,
    up: migrateToV5,
  },
];

const DATABASE_VERSION = migrationSteps[migrationSteps.length - 1].version;

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();
  await runMigrations(db);
}

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(PRAGMA_JOURNAL_MODE_WAL_SQL);
  await db.execAsync(PRAGMA_FOREIGN_KEYS_ON_SQL);

  const versionResult = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  let currentVersion = versionResult?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  while (currentVersion < DATABASE_VERSION) {
    const nextVersion = currentVersion + 1;
    const step = migrationSteps.find((migrationStep) => migrationStep.version === nextVersion);

    if (!step) {
      throw new Error(`Missing migration step for version ${nextVersion}.`);
    }

    await db.withTransactionAsync(async () => {
      await step.up(db);
      await db.execAsync(`PRAGMA user_version = ${step.version}`);
    });

    currentVersion = nextVersion;
  }
}

async function migrateToV1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_V1_SCHEMA_SQL);
}

async function migrateToV2(db: SQLiteDatabase): Promise<void> {
  // Normalize row direction before enforcing pair uniqueness.
  await db.execAsync(NORMALIZE_RELATIONSHIP_DIRECTION_SQL);

  // Defensive cleanup in case old data has invalid self-relationships.
  await db.execAsync(DELETE_SELF_RELATIONSHIPS_SQL);

  // Keep one row per pair before adding the unique index.
  await db.execAsync(DEDUPE_RELATIONSHIPS_SQL);

  await db.execAsync(CREATE_UNIQUE_RELATIONSHIP_PAIR_INDEX_SQL);
}

async function migrateToV3(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_APP_SETTINGS_TABLE_SQL);
}

async function migrateToV4(db: SQLiteDatabase): Promise<void> {
  const noteColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(notes)');
  const hasUpdatedAtColumn = noteColumns.some((column) => column.name === 'updated_at');

  if (!hasUpdatedAtColumn) {
    await db.execAsync(ADD_NOTE_UPDATED_AT_COLUMN_SQL);
  }

  await db.execAsync(BACKFILL_NOTE_UPDATED_AT_SQL);
}

async function migrateToV5(db: SQLiteDatabase): Promise<void> {
  const relationshipColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(relationships)');
  const hasReverseTypeColumn = relationshipColumns.some(
    (column) => column.name === 'reverse_relationship_type'
  );

  if (!hasReverseTypeColumn) {
    await db.execAsync(ADD_RELATIONSHIP_REVERSE_TYPE_COLUMN_SQL);
  }
}
