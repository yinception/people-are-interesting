import type { SQLiteDatabase } from 'expo-sqlite';
import type { EntityTableName } from '../db/sqlConstants';
import { TOUCH_PERSON_UPDATED_AT_SQL } from './sqlQueries';

export interface ExistingIdRow {
  id: number;
}

export async function touchPeopleUpdatedAt(db: SQLiteDatabase, personIds: number[]): Promise<void> {
  for (const personId of new Set(personIds)) {
    await db.runAsync(TOUCH_PERSON_UPDATED_AT_SQL, personId);
  }
}

export function requireRow<T>(row: T | null | undefined, missingRowMessage: string): T {
  if (!row) {
    throw new Error(missingRowMessage);
  }

  return row;
}

export function requireTrimmedText(value: string, emptyMessage: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    throw new Error(emptyMessage);
  }

  return trimmedValue;
}

export function normalizeRelationshipPair(personIdA: number, personIdB: number): [number, number] {
  return personIdA < personIdB ? [personIdA, personIdB] : [personIdB, personIdA];
}

export function createRelationshipPairKey(personIdA: number, personIdB: number): string {
  const [leftId, rightId] = normalizeRelationshipPair(personIdA, personIdB);
  return `${leftId}:${rightId}`;
}

export async function requireEntityExistsById(
  db: SQLiteDatabase,
  tableName: EntityTableName,
  id: number,
  missingEntityMessage: string
): Promise<void> {
  const existing = await db.getFirstAsync<ExistingIdRow>(`SELECT id FROM ${tableName} WHERE id = ?`, id);
  if (!existing) {
    throw new Error(missingEntityMessage);
  }
}