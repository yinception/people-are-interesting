import type { SQLiteDatabase } from 'expo-sqlite';
import type { EntityTableName } from '../db/sqlConstants';

export interface ExistingIdRow {
  id: number;
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