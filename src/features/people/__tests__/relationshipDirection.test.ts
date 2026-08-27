import { resolveRelationshipDirection } from '../relationshipDirection';
import type { Relationship } from '../../../data/database';

const relationship: Relationship = {
  id: 1,
  person_id_a: 10,
  person_id_b: 20,
  relationship_type: 'mentee',
  reverse_relationship_type: 'mentor',
  created_at: '2026-01-01',
};

describe('resolveRelationshipDirection', () => {
  test('reads labels forward when viewing the first person in the pair', () => {
    expect(resolveRelationshipDirection(relationship, 10)).toEqual({
      otherPersonId: 20,
      otherPersonRelationshipType: 'mentee',
      selectedPersonRelationshipType: 'mentor',
    });
  });

  test('swaps labels when viewing the second person in the pair', () => {
    expect(resolveRelationshipDirection(relationship, 20)).toEqual({
      otherPersonId: 10,
      otherPersonRelationshipType: 'mentor',
      selectedPersonRelationshipType: 'mentee',
    });
  });

  test('preserves one-way labels from both perspectives', () => {
    const oneWay: Relationship = { ...relationship, reverse_relationship_type: null };

    expect(resolveRelationshipDirection(oneWay, 10)).toEqual({
      otherPersonId: 20,
      otherPersonRelationshipType: 'mentee',
      selectedPersonRelationshipType: null,
    });

    expect(resolveRelationshipDirection(oneWay, 20)).toEqual({
      otherPersonId: 10,
      otherPersonRelationshipType: null,
      selectedPersonRelationshipType: 'mentee',
    });
  });
});
