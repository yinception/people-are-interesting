export interface Person {
  id: number;
  name: string;
  created_at: string;
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
  relationship_type: string | null;
  created_at: string;
}

export interface PersonWithLatestNote {
  id: number;
  name: string;
  created_at: string;
  latest_note_content: string | null;
  latest_note_created_at: string | null;
}

export interface PersonSearchResult {
  person_id: number;
  person_name: string;
  matched_note_count: number;
}
