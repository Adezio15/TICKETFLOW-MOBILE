import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import {
  Repository,
  type Param,
  type SqlConnection,
  type SqlDatabase,
} from "../src/database/repository";
import { TicketFlowController } from "../src/controllers/ticketFlowController";
import type { EventInput } from "../src/models/entities";
export class NodeDatabase implements SqlDatabase {
  db: DatabaseSync;
  constructor(path = ":memory:") {
    this.db = new DatabaseSync(path);
  }
  async execAsync(sql: string) {
    this.db.exec(sql);
  }
  async runAsync(sql: string, ...params: Param[]) {
    return { changes: Number(this.db.prepare(sql).run(...params).changes) };
  }
  async getFirstAsync<T>(sql: string, ...params: Param[]) {
    return (this.db.prepare(sql).get(...params) as T | undefined) ?? null;
  }
  async getAllAsync<T>(sql: string, ...params: Param[]) {
    return this.db.prepare(sql).all(...params) as T[];
  }
  async withExclusiveTransactionAsync(
    work: (tx: SqlConnection) => Promise<void>,
  ) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      await work(this);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  close() {
    this.db.close();
  }
}
export const validInput: EventInput = {
  name: "Conferência SENAC",
  description: "Uma conferência de tecnologia",
  startsAt: "2030-12-25T22:00:00.000Z",
  location: "Auditório",
  capacity: 2,
  organizer: "Equipe SENAC",
  latitude: null,
  longitude: null,
};
export async function setup(path?: string) {
  const db = new NodeDatabase(path);
  const repo = new Repository(db);
  await repo.initialize();
  const controller = new TicketFlowController(
    repo,
    randomUUID,
    () => new Date("2026-10-16T12:00:00Z"),
  );
  return { db, repo, controller };
}
