import { getDatabase } from '../db/client';
import type { Person, PersonListItem } from '../db/types';
import { requireEntityExistsById, requireRow, requireTrimmedText } from './repositoryUtils';
import {
  DELETE_PERSON_BY_ID_SQL,
  INSERT_PERSON_SQL,
  LIST_PEOPLE_WITH_LATEST_NOTE_SQL,
  SELECT_PERSON_BY_ID_SQL,
  UPDATE_PERSON_NAME_SQL,
} from './sqlQueries';

export async function createPerson(name: string): Promise<Person> {
  const db = await getDatabase();
  const trimmedName = requireTrimmedText(name, 'Name cannot be empty.');

  const result = await db.runAsync(INSERT_PERSON_SQL, trimmedName);
  return requireRow(
    await db.getFirstAsync<Person>(SELECT_PERSON_BY_ID_SQL, result.lastInsertRowId),
    'Failed to create person.'
  );
}

export async function listPeopleWithLatestNote(): Promise<PersonListItem[]> {
  const db = await getDatabase();

  return db.getAllAsync<PersonListItem>(LIST_PEOPLE_WITH_LATEST_NOTE_SQL);
}

export async function updatePersonName(personId: number, name: string): Promise<Person> {
  const db = await getDatabase();
  const trimmedName = requireTrimmedText(name, 'Name cannot be empty.');

  await requireEntityExistsById(db, 'people', personId, `Person with id ${personId} does not exist.`);

  await db.runAsync(UPDATE_PERSON_NAME_SQL, trimmedName, personId);
  return requireRow(
    await db.getFirstAsync<Person>(SELECT_PERSON_BY_ID_SQL, personId),
    'Failed to update person name.'
  );
}

export async function deletePerson(personId: number): Promise<void> {
  const db = await getDatabase();
  await requireEntityExistsById(db, 'people', personId, `Person with id ${personId} does not exist.`);

  await db.runAsync(DELETE_PERSON_BY_ID_SQL, personId);
}
