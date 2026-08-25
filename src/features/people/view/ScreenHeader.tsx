import { Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import type { PeopleScreenUiProps } from './types';

interface ScreenHeaderProps {
  ui: Pick<
    PeopleScreenUiProps,
    | 'headerTitleLeftPadding'
    | 'setViewMode'
    | 'theme'
    | 'viewMode'
    | 'isPeopleSortMenuOpen'
    | 'setIsPeopleSortMenuOpen'
    | 'isPersonActionsMenuOpen'
    | 'setIsPersonActionsMenuOpen'
  >;
}

export function ScreenHeader({ ui }: ScreenHeaderProps) {
  const buttonLabel = '⚙';
  const accessibilityLabel = 'Open settings';

  const onPress = () => {
    if (ui.isPeopleSortMenuOpen) {
      ui.setIsPeopleSortMenuOpen(false);
    }

    if (ui.isPersonActionsMenuOpen) {
      ui.setIsPersonActionsMenuOpen(false);
    }

    ui.setViewMode('settings');
  };

  return (
    <View className="mb-4 mt-3 flex-row items-start justify-between">
      <View className="mr-3 flex-1" style={{ paddingLeft: ui.headerTitleLeftPadding }}>
        <Text className={`text-2xl font-bold ${ui.theme.headingText}`}>People Are Interesting</Text>
      </View>

      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        className={`rounded-xl px-3 py-2 ${ui.theme.navButton}`}
      >
        <Text className={`font-semibold ${ui.theme.navButtonText}`}>{buttonLabel}</Text>
      </AnimatedPressable>
    </View>
  );
}
