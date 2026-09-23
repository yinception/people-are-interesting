import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

export type TransactionScope = Pick<
  SQLiteDatabase,
  'execAsync' | 'getAllAsync' | 'getFirstAsync' | 'runAsync'
>;

// Web defines withExclusiveTransactionAsync but throws on call, so it needs the non-exclusive form.
export async function withExclusiveTransaction(
  db: SQLiteDatabase,
  task: (txn: TransactionScope) => Promise<void>
): Promise<void> {
  if (Platform.OS === 'web') {
    await db.withTransactionAsync(async () => {
      await task(db);
    });
    return;
  }

  await db.withExclusiveTransactionAsync(task);
}
