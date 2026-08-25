import { computeAnchoredMenuPosition } from '../useAnchoredMenu';

describe('computeAnchoredMenuPosition', () => {
  const shared = {
    windowWidth: 390,
    menuWidth: 192,
    menuMargin: 8,
    menuTopOffset: 6,
  };

  test('uses fallback position when trigger layout is unavailable', () => {
    expect(
      computeAnchoredMenuPosition({
        ...shared,
        triggerLayout: null,
      })
    ).toEqual({
      menuLeft: 190,
      menuTop: 8,
    });
  });

  test('anchors to trigger and applies top offset', () => {
    expect(
      computeAnchoredMenuPosition({
        ...shared,
        triggerLayout: {
          x: 300,
          y: 120,
          width: 40,
          height: 44,
        },
      })
    ).toEqual({
      menuLeft: 148,
      menuTop: 170,
    });
  });

  test('clamps left edge to margin when anchor would overflow', () => {
    expect(
      computeAnchoredMenuPosition({
        ...shared,
        triggerLayout: {
          x: 4,
          y: 80,
          width: 20,
          height: 40,
        },
      })
    ).toEqual({
      menuLeft: 8,
      menuTop: 126,
    });
  });

  test('clamps right edge to keep menu fully visible', () => {
    expect(
      computeAnchoredMenuPosition({
        ...shared,
        triggerLayout: {
          x: 380,
          y: 80,
          width: 50,
          height: 40,
        },
      })
    ).toEqual({
      menuLeft: 190,
      menuTop: 126,
    });
  });
});
