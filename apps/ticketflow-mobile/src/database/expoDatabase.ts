import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import type { Param, SqlConnection, SqlDatabase } from "./repository";
const databaseName = "ticketflow-v1.db";
class ExpoDatabase implements SqlDatabase {
  constructor(private db: SQLiteDatabase) {}
  execAsync(sql: string) {
    return this.db.execAsync(sql);
  }
  runAsync(sql: string, ...params: Param[]) {
    return this.db.runAsync(sql, ...params);
  }
  getFirstAsync<T>(sql: string, ...params: Param[]) {
    return this.db.getFirstAsync<T>(sql, ...params);
  }
  getAllAsync<T>(sql: string, ...params: Param[]) {
    return this.db.getAllAsync<T>(sql, ...params);
  }
  async withExclusiveTransactionAsync(
    work: (tx: SqlConnection) => Promise<void>,
  ) {
    // SQLite foreign_keys is per connection and cannot change inside BEGIN.
    const tx = await openDatabaseAsync(databaseName, {
      useNewConnection: true,
    });
    try {
      await tx.execAsync(
        "PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;",
      );
      await tx.execAsync("BEGIN IMMEDIATE");
      try {
        await work(tx);
        await tx.execAsync("COMMIT");
      } catch (error) {
        await tx.execAsync("ROLLBACK");
        throw error;
      }
    } finally {
      await tx.closeAsync();
    }
  }
}
export async function createExpoDatabase(): Promise<SqlDatabase> {
  return new ExpoDatabase(await openDatabaseAsync(databaseName));
}
