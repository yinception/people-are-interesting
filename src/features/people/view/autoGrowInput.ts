import { Platform } from 'react-native';
import { INPUT_AUTO_GROW_WEB_OFFSET } from '../constants';

// Web derives contentSize from the node's own box, so a grown input never reports a smaller size.
// Releasing the inline height before measuring lets it shrink again. Returns null when not applicable.
export function measureWebInputHeight(node: unknown, minHeight: number): number | null {
  if (Platform.OS !== 'web') {
    return null;
  }

  const element = node as { scrollHeight?: number; style?: { height: string } } | null;

  if (!element?.style || typeof element.scrollHeight !== 'number') {
    return null;
  }

  const previousHeight = element.style.height;
  // Collapse first: at height auto a textarea falls back to its default row count and over-reports.
  element.style.height = '0px';
  const measured = element.scrollHeight + INPUT_AUTO_GROW_WEB_OFFSET;
  element.style.height = previousHeight;

  return Math.max(minHeight, measured);
}
