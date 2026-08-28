import { getDatabase } from '../db/client';
import { createRelationshipPairKey, normalizeRelationshipPair } from './repositoryUtils';

export async function seedSampleData(): Promise<void> {
  const db = await getDatabase();

  await db.withExclusiveTransactionAsync(async (txn) => {
    const personCount = randomInt(3, 8);
    const personIds: number[] = [];

    for (let index = 0; index < personCount; index += 1) {
      const name = generatePersonName();
      const personResult = await txn.runAsync(
        "INSERT INTO people (name, updated_at) VALUES (?, datetime('now'))",
        name
      );
      personIds.push(personResult.lastInsertRowId);

      const noteCount = randomInt(1, 5);
      for (let noteIndex = 0; noteIndex < noteCount; noteIndex += 1) {
        const note = generateNote();
        await txn.runAsync('INSERT INTO notes (person_id, content) VALUES (?, ?)', personResult.lastInsertRowId, note);
      }
    }

    const maxRelationships = Math.min(randomInt(1, personCount + 2), (personCount * (personCount - 1)) / 2);
    const usedPairs = new Set<string>();

    let createdRelationships = 0;
    let attempts = 0;
    while (createdRelationships < maxRelationships && attempts < 200) {
      attempts += 1;
      const firstPersonId = personIds[randomInt(0, personIds.length - 1)];
      const secondPersonId = personIds[randomInt(0, personIds.length - 1)];

      if (firstPersonId === secondPersonId) {
        continue;
      }

      const [leftId, rightId] = normalizeRelationshipPair(firstPersonId, secondPersonId);
      const pairKey = createRelationshipPairKey(leftId, rightId);

      if (usedPairs.has(pairKey)) {
        continue;
      }

      usedPairs.add(pairKey);
      createdRelationships += 1;

      await txn.runAsync(
        'INSERT INTO relationships (person_id_a, person_id_b, relationship_type, reverse_relationship_type) VALUES (?, ?, ?, ?)',
        leftId,
        rightId,
        RELATIONSHIP_TYPES[randomInt(0, RELATIONSHIP_TYPES.length - 1)],
        RELATIONSHIP_TYPES[randomInt(0, RELATIONSHIP_TYPES.length - 1)]
      );
    }
  });
}

const FIRST_NAMES = [
  'Alex',
  'Avery',
  'Blake',
  'Cameron',
  'Charlie',
  'Devon',
  'Elliot',
  'Emery',
  'Harper',
  'Jordan',
  'Kai',
  'Logan',
  'Morgan',
  'Quinn',
  'Riley',
  'Rowan',
  'Sage',
  'Taylor',
  'Sydney',
  'Parker',
];

const LAST_NAMES = [
  'Adams',
  'Bennett',
  'Carter',
  'Diaz',
  'Edwards',
  'Foster',
  'Garcia',
  'Hall',
  'Ibrahim',
  'Jenkins',
  'Kim',
  'Lopez',
  'Miller',
  'Nguyen',
  'Owens',
  'Patel',
  'Reed',
  'Shah',
  'Turner',
  'Wright',
];

const NOTE_SNIPPETS = [
  'Met at a design meetup and discussed product strategy.',
  'Works in data science and is exploring mobile analytics.',
  'Mentioned interest in AI tooling for early-stage teams.',
  'Enjoys long-distance running and weekend hikes.',
  'Shared tips on hiring first engineering managers.',
  'Has strong experience with partnerships and sales ops.',
  'Talked about local developer communities and events.',
  'Interested in mentoring junior developers this quarter.',
  'Discussed potential collaboration on a side project.',
  'Focused on improving onboarding and activation metrics.',
  'Recently moved into a product leadership role.',
  'Likes to connect people in design and engineering.',
  'Very thoughtful about customer interviews and feedback.',
  'Has a background in operations and growth experiments.',
  'Planning a talk about building resilient mobile apps.',
];

const RELATIONSHIP_TYPES = [
  'friend',
  'colleague',
  'mentor',
  'former teammate',
  'met at meetup',
  'introduced by mutual friend',
  'industry contact',
  'conference connection',
];

function generatePersonName(): string {
  const firstName = FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)];
  const lastName = LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)];
  return `${firstName} ${lastName}`;
}

function generateNote(): string {
  return NOTE_SNIPPETS[randomInt(0, NOTE_SNIPPETS.length - 1)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
