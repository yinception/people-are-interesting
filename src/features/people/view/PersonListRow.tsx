import { memo } from 'react';
import { Text } from 'react-native';
import type { PersonListItem } from '../../../data/database';
import { AnimatedPressable } from './AnimatedPressable';
import type { ThemeTokens } from './types';

interface PersonListRowProps {
  person: PersonListItem;
  theme: ThemeTokens;
  /** Null when no search is active. */
  matchedNoteCount: number | null;
  onPress: (personId: number) => void;
}

export const PersonListRow = memo(function PersonListRow({
  person,
  theme,
  matchedNoteCount,
  onPress,
}: PersonListRowProps) {
  return (
    <AnimatedPressable className={`mb-2 rounded-xl border p-3 ${theme.border}`} onPress={() => onPress(person.id)}>
      <Text className={`text-base font-semibold ${theme.primaryText}`}>{person.name}</Text>
      <Text className={`mt-1 ${theme.secondaryText}`} numberOfLines={1} ellipsizeMode="tail">
        {person.first_note_content ?? 'No notes yet'}
      </Text>
      {matchedNoteCount !== null ? (
        <Text className={`mt-1 text-xs ${theme.tertiaryText}`}>Matched notes: {matchedNoteCount}</Text>
      ) : null}
    </AnimatedPressable>
  );
});
