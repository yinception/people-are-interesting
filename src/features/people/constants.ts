import type { ThemeMode } from './view/types';

export const UI_LAYOUT = {
  bottomExtraPadding: 10,
  globalKeyboardLiftOffset: 50,
  noteInputMinHeight: 44,
  headerTitleLeftPadding: 10,
} as const;

export const PAGE_TRANSITION = {
  fadeStartOpacity: 0,
  fadeDurationMs: 250,
} as const;

export const PRESSABLE_ANIMATION = {
  disabledRestOpacity: 0.5,
  disabledPressedOpacity: 0.5,
  enabledRestOpacity: 1,
  enabledPressedOpacity: 0.8,
  pressedScale: 0.97,
  pressInSpringSpeed: 40,
  pressOutSpringSpeed: 25,
  pressOutBounciness: 5,
  settleDurationMs: 90,
  pressDurationMs: 80,
} as const;

export const LAYER_Z_INDEX = {
  headerRow: 20,
  dropdownTriggerContainer: 30,
  dropdownMenu: 40,
} as const;

export const DROPDOWN_MENU_ELEVATION = 8;

export const CARD_CLASS = 'rounded-xl border p-3';
export const CARD_WITH_TOP_MARGIN_CLASS = 'mt-4 rounded-xl border p-3';

export const SETTINGS_MODAL_BACKDROP_COLOR = {
  dark: 'rgba(2, 6, 23, 0.46)',
  light: 'rgba(15, 23, 42, 0.24)',
} as const;

export const MENU_MODAL_BACKDROP_COLOR = {
  dark: 'rgba(2, 6, 23, 0.14)',
  light: 'rgba(15, 23, 42, 0.08)',
} as const;

export const MODAL_FADE_TRANSITION = {
  initialOpacity: 0,
  fadeInDurationMs: 220,
  fadeOutDurationMs: 120,
  easingPreset: 'smooth',
} as const;

export type ModalFadeEasingPreset = 'smooth' | 'snappy' | 'linear';

export function getPlaceholderTextColor(themeMode: ThemeMode): string {
  return themeMode === 'dark' ? '#94a3b8' : '#64748b';
}