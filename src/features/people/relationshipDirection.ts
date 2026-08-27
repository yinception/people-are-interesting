import type { Relationship } from '../../data/database';

export interface RelationshipDirection {
  otherPersonId: number;
  /** How the other person relates to the viewed person. */
  otherPersonRelationshipType: string | null;
  /** How the viewed person relates to the other person. */
  selectedPersonRelationshipType: string | null;
}

export function resolveRelationshipDirection(relationship: Relationship, personId: number): RelationshipDirection {
  const isViewedPersonA = relationship.person_id_a === personId;

  return {
    otherPersonId: isViewedPersonA ? relationship.person_id_b : relationship.person_id_a,
    otherPersonRelationshipType: isViewedPersonA
      ? relationship.relationship_type
      : relationship.reverse_relationship_type,
    selectedPersonRelationshipType: isViewedPersonA
      ? relationship.reverse_relationship_type
      : relationship.relationship_type,
  };
}
