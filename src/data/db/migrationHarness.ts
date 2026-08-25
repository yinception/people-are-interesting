import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';
import { CREATE_V1_SCHEMA_SQL, PRAGMA_FOREIGN_KEYS_ON_SQL } from './sqlConstants';

const HARNESS_DATABASE_NAME = 'migration-harness.db';

interface MigrationHarnessResult {
  beforeCount: number;
  afterCount: number;
  duplicatePairCount: number;
  selfRelationshipCount: number;
  outOfOrderPairCount: number;
  finalVersion: number;
  passed: boolean;
}

export async function runMigrationHarness(): Promise<MigrationHarnessResult> {
  await SQLite.deleteDatabaseAsync(HARNESS_DATABASE_NAME);
  const db = await SQLite.openDatabaseAsync(HARNESS_DATABASE_NAME, { useNewConnection: true });

  try {
    await seedLegacyV1Data(db);

    const beforeCountRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM relationships'
    );
    const beforeCount = beforeCountRow?.count ?? 0;

    await runMigrations(db);

    const [afterCountRow, duplicatePairRow, selfRelationshipRow, outOfOrderPairRow, versionRow] =
      await Promise.all([
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM relationships'),
        db.getFirstAsync<{ count: number }>(
          `
            SELECT COUNT(*) AS count
            FROM (
              SELECT person_id_a, person_id_b, COUNT(*) AS row_count
              FROM relationships
              GROUP BY person_id_a, person_id_b
              HAVING row_count > 1
            )
          `
        ),
        db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) AS count FROM relationships WHERE person_id_a = person_id_b'
        ),
        db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) AS count FROM relationships WHERE person_id_a > person_id_b'
        ),
        db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'),
      ]);

    const result: MigrationHarnessResult = {
      beforeCount,
      afterCount: afterCountRow?.count ?? 0,
      duplicatePairCount: duplicatePairRow?.count ?? 0,
      selfRelationshipCount: selfRelationshipRow?.count ?? 0,
      outOfOrderPairCount: outOfOrderPairRow?.count ?? 0,
      finalVersion: versionRow?.user_version ?? 0,
      passed:
        (duplicatePairRow?.count ?? 0) === 0 &&
        (selfRelationshipRow?.count ?? 0) === 0 &&
        (outOfOrderPairRow?.count ?? 0) === 0 &&
        (versionRow?.user_version ?? 0) >= 2,
    };

    return result;
  } finally {
    await db.closeAsync();
    await SQLite.deleteDatabaseAsync(HARNESS_DATABASE_NAME);
  }
}

async function seedLegacyV1Data(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(PRAGMA_FOREIGN_KEYS_ON_SQL);
  await db.execAsync(CREATE_V1_SCHEMA_SQL);

  await db.withTransactionAsync(async () => {
    const person1 = await db.runAsync('INSERT INTO people (name) VALUES (?)', 'Ari');
    const person2 = await db.runAsync('INSERT INTO people (name) VALUES (?)', 'Blair');
    const person3 = await db.runAsync('INSERT INTO people (name) VALUES (?)', 'Casey');

    const a = person1.lastInsertRowId;
    const b = person2.lastInsertRowId;
    const c = person3.lastInsertRowId;

    await db.runAsync(
      'INSERT INTO relationships (person_id_a, person_id_b, relationship_type) VALUES (?, ?, ?)',
      a,
      b,
      'colleague'
    );

    await db.runAsync(
      'INSERT INTO relationships (person_id_a, person_id_b, relationship_type) VALUES (?, ?, ?)',
      b,
      a,
      'duplicate reverse'
    );

    await db.runAsync(
      'INSERT INTO relationships (person_id_a, person_id_b, relationship_type) VALUES (?, ?, ?)',
      a,
      b,
      'duplicate same order'
    );

    await db.runAsync(
      'INSERT INTO relationships (person_id_a, person_id_b, relationship_type) VALUES (?, ?, ?)',
      c,
      c,
      'invalid self relationship'
    );
  });

  await db.execAsync('PRAGMA user_version = 1');
}
