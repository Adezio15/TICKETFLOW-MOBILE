export const schema = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS eventos (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, startsAt TEXT NOT NULL,
 location TEXT NOT NULL, capacity INTEGER NOT NULL CHECK(capacity > 0), organizer TEXT NOT NULL,
 latitude REAL, longitude REAL, demo INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ingressos (
 id TEXT PRIMARY KEY, eventId TEXT NOT NULL REFERENCES eventos(id) ON DELETE RESTRICT,
 participant TEXT NOT NULL, issuedAt TEXT NOT NULL, usedAt TEXT
);
CREATE TABLE IF NOT EXISTS validacoes (
 id TEXT PRIMARY KEY, ticketId TEXT NOT NULL UNIQUE REFERENCES ingressos(id) ON DELETE RESTRICT,
 validatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(startsAt);
CREATE INDEX IF NOT EXISTS idx_ingressos_evento ON ingressos(eventId);
CREATE INDEX IF NOT EXISTS idx_ingressos_situacao ON ingressos(usedAt);
CREATE TRIGGER IF NOT EXISTS limite_capacidade BEFORE INSERT ON ingressos
WHEN (SELECT COUNT(*) FROM ingressos WHERE eventId = NEW.eventId) >=
 (SELECT capacity FROM eventos WHERE id = NEW.eventId)
BEGIN SELECT RAISE(ABORT, 'Capacidade esgotada.'); END;
PRAGMA user_version = 1;
`;
