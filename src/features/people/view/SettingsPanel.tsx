import { Text, View } from 'react-native';
import type { UsePeopleScreenModelResult } from '../usePeopleScreenModel';
import { CARD_CLASS, CARD_WITH_TOP_MARGIN_CLASS } from '../constants';
import { AnimatedPressable } from './AnimatedPressable';
import type { PeopleScreenUiProps } from './types';

interface SettingsPanelProps {
  model: Pick<UsePeopleScreenModelResult, 'isLoading' | 'isSeeding'>;
  ui: Pick<
    PeopleScreenUiProps,
    | 'theme'
    | 'themeMode'
    | 'isSavingTheme'
    | 'isExportingData'
    | 'isImportingData'
    | 'onToggleThemeModePress'
    | 'onConfirmSeedPress'
    | 'onExportDataPress'
    | 'onImportDataPress'
  >;
}

export function SettingsPanel({ model, ui }: SettingsPanelProps) {
  return (
    <View className={`pb-2 ${ui.theme.panelBackground}`}>
      <View className={`${CARD_CLASS} ${ui.theme.border} ${ui.theme.cardBackground}`}>
        <Text className={`text-sm font-semibold ${ui.theme.primaryText}`}>Dark mode</Text>
        <Text className={`mt-1 text-sm ${ui.theme.secondaryText}`}>
          Switch between light and dark themes for easier reading.
        </Text>

        <Text className={`mt-1 text-sm ${ui.theme.secondaryText}`}>Current theme: {ui.themeMode === 'dark' ? 'Dark' : 'Light'}</Text>

        <AnimatedPressable
          accessibilityRole="button"
          disabled={model.isLoading || ui.isSavingTheme}
          onPress={() => void ui.onToggleThemeModePress()}
          className={`mt-3 items-center rounded-xl py-3 ${ui.themeMode === 'dark' ? 'bg-amber-500' : 'bg-slate-800'}`}
        >
          <Text className="font-semibold text-white">
            {ui.isSavingTheme ? 'Saving...' : ui.themeMode === 'dark' ? 'Disable dark mode' : 'Enable dark mode'}
          </Text>
        </AnimatedPressable>
      </View>

      <View className={`${CARD_WITH_TOP_MARGIN_CLASS} ${ui.theme.border} ${ui.theme.cardBackground}`}>
        <Text className={`text-sm font-semibold ${ui.theme.primaryText}`}>Export</Text>
        <Text className={`mt-1 text-sm ${ui.theme.secondaryText}`}>
          Export all local people, notes, relationships, and settings as a CSV file.
        </Text>

        <AnimatedPressable
          accessibilityRole="button"
          disabled={model.isLoading || ui.isExportingData}
          onPress={() => void ui.onExportDataPress()}
          className="mt-3 items-center rounded-xl bg-teal-700 py-3"
        >
          <Text className="font-semibold text-white">{ui.isExportingData ? 'Exporting...' : 'Export all data as CSV'}</Text>
        </AnimatedPressable>
      </View>

      <View className={`${CARD_WITH_TOP_MARGIN_CLASS} ${ui.theme.border} ${ui.theme.cardBackground}`}>
        <Text className={`text-sm font-semibold ${ui.theme.primaryText}`}>Import</Text>
        <Text className={`mt-1 text-sm ${ui.theme.secondaryText}`}>
          Import and replace all local people, notes, relationships, and settings from a CSV export file.
        </Text>

        <AnimatedPressable
          accessibilityRole="button"
          disabled={model.isLoading || ui.isImportingData}
          onPress={ui.onImportDataPress}
          className="mt-3 items-center rounded-xl bg-amber-700 py-3"
        >
          <Text className="font-semibold text-white">{ui.isImportingData ? 'Importing...' : 'Import data from CSV'}</Text>
        </AnimatedPressable>
      </View>

      <View className={`${CARD_WITH_TOP_MARGIN_CLASS} ${ui.theme.border} ${ui.theme.cardBackground}`}>
        <Text className={`text-sm font-semibold ${ui.theme.primaryText}`}>Development</Text>
        <Text className={`mt-1 text-sm ${ui.theme.secondaryText}`}>
          Populate local SQLite with sample people, notes, and relationships.
        </Text>

        <AnimatedPressable
          accessibilityRole="button"
          disabled={model.isLoading || model.isSeeding}
          onPress={ui.onConfirmSeedPress}
          className="mt-3 items-center rounded-xl bg-blue-600 py-3"
        >
          <Text className="font-semibold text-white">{model.isSeeding ? 'Seeding...' : 'Create sample data'}</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}
