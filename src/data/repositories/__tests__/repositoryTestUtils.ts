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
