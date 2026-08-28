export interface Person {
  id: number;
  name: string;
  created_at: string;
  /** Null for rows created before this column existed; fall back to created_at. */
  updated_at: string | null;
}

export interface Note {
  id: number;
  person_id: number;
  content: string;
  created_at: string;
  updated_at: string | null;
}

export interface Relationship {
  id: number;
  person_id_a: number;
  person_id_b: number;
  /** How person_id_b relates to person_id_a. */
  relationship_type: string | null;
  /** How person_id_a relates to person_id_b. */
  reverse_relationship_type: string | null;
  created_at: string;
}

export interface PersonListItem extends Person {
  first_note_content: string | null;
}

export interface PersonSearchResult {
  person_id: number;
  person_name: string;
  matched_note_count: number;
}
