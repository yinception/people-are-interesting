import { getDatabase } from '../db/client';
import type { PersonSearchResult } from '../db/types';
import { SEARCH_PEOPLE_AND_NOTES_SQL } from './sqlQueries';

export async function searchPeopleAndNotes(term: string): Promise<PersonSearchResult[]> {
  const db = await getDatabase();
  const normalizedTerm = term.trim();

  if (!normalizedTerm) {
    return [];
  }

  const likeTerm = `%${normalizedTerm}%`;

  return db.getAllAsync<PersonSearchResult>(
    SEARCH_PEOPLE_AND_NOTES_SQL,
    likeTerm,
    likeTerm,
    likeTerm
  );
}
