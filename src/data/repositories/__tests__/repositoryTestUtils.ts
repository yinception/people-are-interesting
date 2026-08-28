export type MockDb = {
  getAllAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  runAsync: jest.Mock;
  withExclusiveTransactionAsync: jest.Mock;
};

export function createMockDb(): MockDb {
  return {
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    runAsync: jest.fn(),
    withExclusiveTransactionAsync: jest.fn(),
  };
}

export function createMockTxn() {
  return {
    runAsync: jest.fn().mockResolvedValue(undefined),
  };
}

export function getTouchedPersonIds(db: MockDb): number[] {
  return db.runAsync.mock.calls
    .filter((call: unknown[]) => String(call[0]).startsWith('UPDATE people SET updated_at'))
    .map((call: unknown[]) => call[1] as number);
}
