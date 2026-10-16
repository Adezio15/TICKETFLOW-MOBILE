import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setup, validInput } from "./helpers";
import { ticketPayload, parseLocalDate } from "../src/utils/format";
test("cria evento válido e persiste os campos", async () => {
  const { db, controller, repo } = await setup();
  try {
    const event = await controller.createEvent(validInput);
    assert.equal((await repo.events()).length, 1);
    assert.equal((await repo.event(event.id))?.name, validInput.name);
    assert.equal(event.demo, 0);
  } finally {
    db.close();
  }
});
test("rejeita campos, capacidade, data e coordenadas inválidos", async () => {
  const { db, controller, repo } = await setup();
  try {
    for (const override of [
      { name: "" },
      { description: " " },
      { organizer: "x" },
      { location: "" },
      { capacity: 0 },
      { capacity: 1.5 },
      { capacity: NaN },
      { capacity: 1000001 },
      { startsAt: "inválido" },
      { startsAt: "2020-01-01" },
      { latitude: 100, longitude: 0 },
      { latitude: 0, longitude: null },
    ])
      await assert.rejects(
        controller.createEvent({ ...validInput, ...override }),
      );
    assert.equal((await repo.events()).length, 0);
  } finally {
    db.close();
  }
});
test("emite ingresso com identificador único e participante normalizado", async () => {
  const { db, controller, repo } = await setup();
  try {
    const event = await controller.createEvent(validInput);
    const t1 = await controller.issue(event.id, "  Ana Silva  ");
    const t2 = await controller.issue(event.id, "João Silva");
    assert.notEqual(t1.id, t2.id);
    assert.equal(t1.participant, "Ana Silva");
    assert.equal((await repo.history()).length, 2);
    const payload = JSON.parse(ticketPayload(t1));
    assert.equal(payload.eventId, event.id);
    assert.equal(payload.ticketId, t1.id);
  } finally {
    db.close();
  }
});
test("impede emissão acima da capacidade, inclusive solicitações simultâneas", async () => {
  const { db, controller, repo } = await setup();
  try {
    const event = await controller.createEvent({ ...validInput, capacity: 1 });
    const results = await Promise.allSettled([
      controller.issue(event.id, "Ana Silva"),
      controller.issue(event.id, "Bruno Silva"),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal((await repo.history()).length, 1);
    await assert.rejects(
      controller.issue(event.id, "Carlos Silva"),
      /Capacidade/,
    );
  } finally {
    db.close();
  }
});
test("trigger também bloqueia ultrapassar capacidade diretamente no SQL", async () => {
  const { db, controller } = await setup();
  try {
    const event = await controller.createEvent({ ...validInput, capacity: 1 });
    await controller.issue(event.id, "Ana Silva");
    await assert.rejects(
      db.runAsync(
        "INSERT INTO ingressos VALUES (?,?,?,?,?)",
        "outro",
        event.id,
        "Pessoa",
        "2026-10-16",
        null,
      ),
      /Capacidade/,
    );
  } finally {
    db.close();
  }
});
test("valida ingresso por QR e grava horário e registro de validação", async () => {
  const { db, controller, repo } = await setup();
  try {
    const event = await controller.createEvent(validInput);
    const ticket = await controller.issue(event.id, "Ana Silva");
    const result = await controller.validate(ticketPayload(ticket), event.id);
    assert.equal(result.ok, true);
    assert.equal(
      (await repo.ticket(ticket.id))?.usedAt,
      "2026-10-16T12:00:00.000Z",
    );
    assert.equal((await db.getAllAsync("SELECT * FROM validacoes")).length, 1);
  } finally {
    db.close();
  }
});
test("bloqueia segunda utilização por QR e código manual", async () => {
  const { db, controller } = await setup();
  try {
    const event = await controller.createEvent(validInput);
    const ticket = await controller.issue(event.id, "Ana Silva");
    assert.equal((await controller.validate(ticket.id)).ok, true);
    const again = await controller.validate(ticketPayload(ticket));
    assert.equal(again.ok, false);
    assert.match(again.message, /já utilizado/);
    assert.equal((await db.getAllAsync("SELECT * FROM validacoes")).length, 1);
  } finally {
    db.close();
  }
});
test("duas validações simultâneas aprovam apenas uma entrada", async () => {
  const { db, controller } = await setup();
  try {
    const event = await controller.createEvent(validInput);
    const ticket = await controller.issue(event.id, "Ana Silva");
    const results = await Promise.all([
      controller.validate(ticket.id),
      controller.validate(ticket.id),
    ]);
    assert.equal(results.filter((r) => r.ok).length, 1);
    assert.equal((await db.getAllAsync("SELECT * FROM validacoes")).length, 1);
  } finally {
    db.close();
  }
});
test("rejeita inexistente, QR malformado, evento divergente e portaria de outro evento", async () => {
  const { db, controller, repo } = await setup();
  try {
    const e = await controller.createEvent(validInput);
    const t = await controller.issue(e.id, "Ana Silva");
    for (const raw of [
      "inexistente",
      "{",
      "{}",
      JSON.stringify({ app: "Outro", v: 1, ticketId: t.id, eventId: e.id }),
      JSON.stringify({
        app: "TicketFlow",
        v: 1,
        ticketId: t.id,
        eventId: "outro",
      }),
    ])
      assert.equal((await controller.validate(raw)).ok, false);
    assert.equal((await controller.validate(t.id, "outro")).ok, false);
    assert.equal((await repo.ticket(t.id))?.usedAt, null);
  } finally {
    db.close();
  }
});
test("rollback desfaz utilização se registro da validação falhar", async () => {
  const { db, controller, repo } = await setup();
  try {
    const e = await controller.createEvent(validInput);
    const t = await controller.issue(e.id, "Ana Silva");
    await db.execAsync(
      "CREATE TRIGGER fail_validation BEFORE INSERT ON validacoes BEGIN SELECT RAISE(ABORT, 'falha simulada'); END;",
    );
    await assert.rejects(controller.validate(t.id), /falha simulada/);
    assert.equal((await repo.ticket(t.id))?.usedAt, null);
    await db.execAsync("DROP TRIGGER fail_validation");
    assert.equal((await controller.validate(t.id)).ok, true);
  } finally {
    db.close();
  }
});
test("consulta histórico por evento e situação", async () => {
  const { db, controller, repo } = await setup();
  try {
    const e1 = await controller.createEvent(validInput);
    const e2 = await controller.createEvent(validInput);
    const t = await controller.issue(e1.id, "Ana Silva");
    await controller.issue(e1.id, "Bruno Silva");
    await controller.issue(e2.id, "Carla Silva");
    await controller.validate(t.id);
    assert.equal((await repo.history()).length, 3);
    assert.equal((await repo.history(e1.id)).length, 2);
    assert.equal((await repo.history(e1.id, "used")).length, 1);
    assert.equal((await repo.history(e1.id, "pending")).length, 1);
    assert.equal((await repo.history(undefined, "pending")).length, 2);
  } finally {
    db.close();
  }
});
test("SQLite em arquivo preserva dados ao fechar e reabrir", async () => {
  const folder = await mkdtemp(join(tmpdir(), "ticketflow-test-"));
  const path = join(folder, "test.db");
  try {
    const first = await setup(path);
    const e = await first.controller.createEvent(validInput);
    const t = await first.controller.issue(e.id, "Ana Silva");
    await first.controller.validate(t.id);
    first.db.close();
    const second = await setup(path);
    try {
      assert.equal((await second.repo.events()).length, 1);
      assert.ok((await second.repo.ticket(t.id))?.usedAt);
      assert.equal((await second.controller.validate(t.id)).ok, false);
    } finally {
      second.db.close();
    }
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
test("semente demonstrativa só é inserida com banco vazio", async () => {
  const { db, controller, repo } = await setup();
  try {
    await controller.seed();
    await controller.seed();
    const events = await repo.events();
    assert.equal(events.length, 1);
    assert.equal(events[0].demo, 1);
    assert.equal((await repo.history()).length, 1);
  } finally {
    db.close();
  }
});
test("não emite para evento inexistente ou participante inválido", async () => {
  const { db, controller } = await setup();
  try {
    await assert.rejects(
      controller.issue("inexistente", "Ana Silva"),
      /Evento/,
    );
    await assert.rejects(controller.issue("inexistente", " "), /participante/);
  } finally {
    db.close();
  }
});
test("data local rejeita dias inexistentes e horários fora do intervalo", () => {
  assert.throws(() => parseLocalDate("31/02/2030", "19:00"));
  assert.throws(() => parseLocalDate("25/12/2030", "24:00"));
  assert.ok(parseLocalDate("25/12/2030", "19:00").endsWith("Z"));
});
