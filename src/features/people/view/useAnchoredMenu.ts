import { useCallback, useState } from 'react';
import { useWindowDimensions, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

interface TriggerLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ComputeAnchoredMenuPositionParams {
  windowWidth: number;
  menuWidth: number;
  menuMargin: number;
  menuTopOffset: number;
  triggerLayout: TriggerLayout | null;
}

interface TriggerSize {
  width: number;
  height: number;
}

interface UseAnchoredMenuParams {
  isOpen: boolean;
  setIsOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  menuWidth: number;
  menuMargin: number;
  menuTopOffset: number;
}

interface UseAnchoredMenuResult {
  closeMenu: () => void;
  toggleMenu: (event: GestureResponderEvent) => void;
  onTriggerLayout: (event: LayoutChangeEvent) => void;
  menuLeft: number;
  menuTop: number;
}

export function computeAnchoredMenuPosition({
  windowWidth,
  menuWidth,
  menuMargin,
  menuTopOffset,
  triggerLayout,
}: ComputeAnchoredMenuPositionParams): Pick<UseAnchoredMenuResult, 'menuLeft' | 'menuTop'> {
  const rawLeft = triggerLayout ? triggerLayout.x + triggerLayout.width - menuWidth : windowWidth - menuWidth - menuMargin;
  const menuLeft = Math.max(menuMargin, Math.min(rawLeft, windowWidth - menuWidth - menuMargin));
  const menuTop = triggerLayout ? triggerLayout.y + triggerLayout.height + menuTopOffset : menuMargin;

  return {
    menuLeft,
    menuTop,
  };
}

export function useAnchoredMenu({
  isOpen,
  setIsOpen,
  menuWidth,
  menuMargin,
  menuTopOffset,
}: UseAnchoredMenuParams): UseAnchoredMenuResult {
  const { width: windowWidth } = useWindowDimensions();
  const [triggerLayout, setTriggerLayout] = useState<TriggerLayout | null>(null);
  const [triggerSize, setTriggerSize] = useState<TriggerSize>({ width: 0, height: 0 });

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const openMenu = useCallback(
    (event: GestureResponderEvent) => {
      const { pageX, pageY, locationX, locationY } = event.nativeEvent;
      const x = pageX - locationX;
      const y = pageY - locationY;
      setTriggerLayout({ x, y, width: triggerSize.width, height: triggerSize.height });
      setIsOpen(true);
    },
    [setIsOpen, triggerSize.height, triggerSize.width]
  );

  const toggleMenu = useCallback(
    (event: GestureResponderEvent) => {
      if (isOpen) {
        closeMenu();
        return;
      }

      openMenu(event);
    },
    [closeMenu, isOpen, openMenu]
  );

  const onTriggerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setTriggerSize({ width, height });
  }, []);

  const { menuLeft, menuTop } = computeAnchoredMenuPosition({
    windowWidth,
    menuWidth,
    menuMargin,
    menuTopOffset,
    triggerLayout,
  });

  return {
    closeMenu,
    toggleMenu,
    onTriggerLayout,
    menuLeft,
    menuTop,
  };
}
