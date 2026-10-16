import type {
  Event,
  Ticket,
  TicketHistory,
  TicketStatus,
  Validation,
} from "../models/entities";
import { schema } from "./schema";
export type Param = string | number | null;
export interface SqlConnection {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: Param[]): Promise<{ changes: number }>;
  getFirstAsync<T>(sql: string, ...params: Param[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: Param[]): Promise<T[]>;
}
export interface SqlDatabase extends SqlConnection {
  withExclusiveTransactionAsync(
    task: (tx: SqlConnection) => Promise<void>,
  ): Promise<void>;
}
const historySql = `SELECT i.*, e.name AS eventName, e.startsAt, e.demo
 FROM ingressos i JOIN eventos e ON e.id = i.eventId`;
export class Repository {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private db: SqlDatabase) {}
  initialize() {
    return this.db.execAsync(schema);
  }
  // Serialize local writes and use an exclusive database transaction for atomic commits.
  transaction<T>(work: (tx: SqlConnection) => Promise<T>): Promise<T> {
    const job = this.queue.then(async () => {
      let result!: T;
      await this.db.withExclusiveTransactionAsync(async (tx) => {
        result = await work(tx);
      });
      return result;
    });
    this.queue = job.catch(() => undefined);
    return job;
  }
  events() {
    return this.db.getAllAsync<Event>(
      "SELECT * FROM eventos ORDER BY startsAt",
    );
  }
  event(id: string, tx: SqlConnection = this.db) {
    return tx.getFirstAsync<Event>("SELECT * FROM eventos WHERE id = ?", id);
  }
  async insertEvent(event: Event, tx: SqlConnection = this.db) {
    await tx.runAsync(
      `INSERT INTO eventos
      (id,name,description,startsAt,location,capacity,organizer,latitude,longitude,demo,createdAt)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      event.id,
      event.name,
      event.description,
      event.startsAt,
      event.location,
      event.capacity,
      event.organizer,
      event.latitude,
      event.longitude,
      event.demo,
      event.createdAt,
    );
  }
  ticket(id: string, tx: SqlConnection = this.db) {
    return tx.getFirstAsync<TicketHistory>(historySql + " WHERE i.id = ?", id);
  }
  async count(eventId: string, tx: SqlConnection) {
    return (await tx.getFirstAsync<{ total: number }>(
      "SELECT COUNT(*) AS total FROM ingressos WHERE eventId = ?",
      eventId,
    ))!.total;
  }
  async insertTicket(t: Ticket, tx: SqlConnection) {
    await tx.runAsync(
      "INSERT INTO ingressos (id,eventId,participant,issuedAt,usedAt) VALUES (?,?,?,?,?)",
      t.id,
      t.eventId,
      t.participant,
      t.issuedAt,
      t.usedAt,
    );
  }
  async useTicket(id: string, date: string, tx: SqlConnection) {
    return (
      (
        await tx.runAsync(
          "UPDATE ingressos SET usedAt = ? WHERE id = ? AND usedAt IS NULL",
          date,
          id,
        )
      ).changes === 1
    );
  }
  async insertValidation(v: Validation, tx: SqlConnection) {
    await tx.runAsync(
      "INSERT INTO validacoes (id,ticketId,validatedAt) VALUES (?,?,?)",
      v.id,
      v.ticketId,
      v.validatedAt,
    );
  }
  history(eventId?: string, status: TicketStatus = "all") {
    const clauses: string[] = [];
    const params: Param[] = [];
    if (eventId) {
      clauses.push("i.eventId = ?");
      params.push(eventId);
    }
    if (status !== "all")
      clauses.push(
        status === "used" ? "i.usedAt IS NOT NULL" : "i.usedAt IS NULL",
      );
    return this.db.getAllAsync<TicketHistory>(
      historySql +
        (clauses.length ? " WHERE " + clauses.join(" AND ") : "") +
        " ORDER BY i.issuedAt DESC",
      ...params,
    );
  }
}
