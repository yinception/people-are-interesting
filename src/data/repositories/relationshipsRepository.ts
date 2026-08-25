import { getDatabase } from '../db/client';
import type { Relationship } from '../db/types';
import {
  normalizeRelationshipPair,
  requireEntityExistsById,
  requireRow,
} from './repositoryUtils';
import {
  DELETE_RELATIONSHIP_BY_ID_SQL,
  INSERT_RELATIONSHIP_SQL,
  LIST_RELATIONSHIPS_FOR_PERSON_BY_CREATED_SQL,
  SELECT_PEOPLE_BY_IDS_SQL,
  SELECT_RELATIONSHIP_BY_ID_SQL,
  SELECT_RELATIONSHIP_ID_BY_PAIR_SQL,
  UPDATE_RELATIONSHIP_TYPE_SQL,
} from './sqlQueries';

export async function createRelationship(
  personIdA: number,
  personIdB: number,
  relationshipType: string | null
): Promise<Relationship> {
  const db = await getDatabase();

  if (personIdA === personIdB) {
    throw new Error('Cannot create a relationship to the same person.');
  }

  const [leftId, rightId] = normalizeRelationshipPair(personIdA, personIdB);
  const normalizedType = relationshipType?.trim() || null;

  const people = await db.getAllAsync<{ id: number }>(SELECT_PEOPLE_BY_IDS_SQL, leftId, rightId);
  if (people.length !== 2) {
    throw new Error('Both people must exist before creating a relationship.');
  }

  const existing = await db.getFirstAsync<{ id: number }>(
    SELECT_RELATIONSHIP_ID_BY_PAIR_SQL,
    leftId,
    rightId
  );

  if (existing) {
    await db.runAsync(UPDATE_RELATIONSHIP_TYPE_SQL, normalizedType, existing.id);
    return requireRow(
      await db.getFirstAsync<Relationship>(SELECT_RELATIONSHIP_BY_ID_SQL, existing.id),
      'Failed to read updated relationship.'
    );
  }

  const result = await db.runAsync(INSERT_RELATIONSHIP_SQL, leftId, rightId, normalizedType);

  return requireRow(
    await db.getFirstAsync<Relationship>(SELECT_RELATIONSHIP_BY_ID_SQL, result.lastInsertRowId),
    'Failed to create relationship.'
  );
}

export async function listRelationshipsForPerson(personId: number): Promise<Relationship[]> {
  const db = await getDatabase();

  return db.getAllAsync<Relationship>(LIST_RELATIONSHIPS_FOR_PERSON_BY_CREATED_SQL, personId, personId);
}

export async function deleteRelationship(relationshipId: number): Promise<void> {
  const db = await getDatabase();
  await requireEntityExistsById(db, 'relationships', relationshipId, 'Relationship not found.');

  await db.runAsync(DELETE_RELATIONSHIP_BY_ID_SQL, relationshipId);
}
