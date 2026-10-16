import type {
  Event,
  EventInput,
  Ticket,
  ValidationResult,
} from "../models/entities";
import { Repository } from "../database/repository";
export class TicketFlowController {
  constructor(
    public repository: Repository,
    private uuid: () => string,
    private now = () => new Date(),
  ) {}
  async createEvent(input: EventInput): Promise<Event> {
    const { name, description, location, organizer } = input;
    if (
      ![name, description, location, organizer].every(
        (v) => typeof v === "string" && v.trim().length >= 2,
      )
    )
      throw new Error(
        "Preencha nome, descrição, local e organizador com pelo menos 2 caracteres.",
      );
    if (
      !Number.isInteger(input.capacity) ||
      input.capacity < 1 ||
      input.capacity > 1000000
    )
      throw new Error("Informe uma capacidade inteira entre 1 e 1.000.000.");
    const date = new Date(input.startsAt);
    if (!Number.isFinite(date.getTime()) || date <= this.now())
      throw new Error("Escolha uma data e horário futuros válidos.");
    const { latitude, longitude } = input;
    if (
      (latitude === null) !== (longitude === null) ||
      (latitude !== null &&
        (!Number.isFinite(latitude) || Math.abs(latitude) > 90)) ||
      (longitude !== null &&
        (!Number.isFinite(longitude) || Math.abs(longitude) > 180))
    )
      throw new Error("Coordenadas inválidas.");
    const event: Event = {
      ...input,
      name: name.trim(),
      description: description.trim(),
      location: location.trim(),
      organizer: organizer.trim(),
      startsAt: date.toISOString(),
      id: this.uuid(),
      demo: 0,
      createdAt: this.now().toISOString(),
    };
    await this.repository.transaction((tx) =>
      this.repository.insertEvent(event, tx),
    );
    return event;
  }
  issue(eventId: string, participant: string): Promise<Ticket> {
    if (participant.trim().length < 2 || participant.trim().length > 120)
      return Promise.reject(
        new Error("Informe um participante com 2 a 120 caracteres."),
      );
    return this.repository.transaction(async (tx) => {
      const event = await this.repository.event(eventId, tx);
      if (!event) throw new Error("Evento não encontrado.");
      if (new Date(event.startsAt) <= this.now())
        throw new Error("Este evento já começou.");
      if ((await this.repository.count(eventId, tx)) >= event.capacity)
        throw new Error("Capacidade esgotada.");
      const ticket: Ticket = {
        id: this.uuid(),
        eventId,
        participant: participant.trim(),
        issuedAt: this.now().toISOString(),
        usedAt: null,
      };
      await this.repository.insertTicket(ticket, tx);
      return ticket;
    });
  }
  validate(raw: string, selectedEventId?: string): Promise<ValidationResult> {
    let id = raw.trim();
    let qrEvent: string | undefined;
    if (id.startsWith("{")) {
      try {
        const payload: unknown = JSON.parse(id);
        if (
          !payload ||
          typeof payload !== "object" ||
          !("app" in payload) ||
          payload.app !== "TicketFlow" ||
          !("v" in payload) ||
          payload.v !== 1 ||
          !("ticketId" in payload) ||
          typeof payload.ticketId !== "string" ||
          !("eventId" in payload) ||
          typeof payload.eventId !== "string"
        )
          throw new Error();
        id = payload.ticketId;
        qrEvent = payload.eventId;
      } catch {
        return Promise.resolve({
          ok: false,
          message: "QR Code inválido. Use um ingresso TicketFlow.",
        });
      }
    }
    if (!id || id.length > 200)
      return Promise.resolve({ ok: false, message: "Código inválido." });
    return this.repository.transaction(async (tx) => {
      const ticket = await this.repository.ticket(id, tx);
      if (!ticket)
        return {
          ok: false,
          message: "Ingresso não encontrado neste aparelho.",
        };
      if (
        (qrEvent && qrEvent !== ticket.eventId) ||
        (selectedEventId && selectedEventId !== ticket.eventId)
      )
        return { ok: false, message: "O ingresso pertence a outro evento." };
      if (ticket.usedAt)
        return { ok: false, message: "Ingresso já utilizado.", ticket };
      const date = this.now().toISOString();
      if (!(await this.repository.useTicket(id, date, tx)))
        return { ok: false, message: "Ingresso já utilizado." };
      await this.repository.insertValidation(
        { id: this.uuid(), ticketId: id, validatedAt: date },
        tx,
      );
      return {
        ok: true,
        message: "Entrada confirmada!",
        ticket: { ...ticket, usedAt: date },
      };
    });
  }
  async seed() {
    await this.repository.transaction(async (tx) => {
      const count = await tx.getFirstAsync<{ total: number }>(
        "SELECT COUNT(*) AS total FROM eventos",
      );
      if (count?.total) return;
      const starts = new Date(this.now());
      starts.setDate(starts.getDate() + 7);
      starts.setHours(19, 0, 0, 0);
      const event: Event = {
        id: this.uuid(),
        name: "Encontro de Tecnologia · Demo",
        description: "Evento demonstrativo para conhecer o TicketFlow.",
        startsAt: starts.toISOString(),
        location: "Auditório SENAC (demonstração)",
        capacity: 30,
        organizer: "Organização demonstrativa",
        latitude: null,
        longitude: null,
        demo: 1,
        createdAt: this.now().toISOString(),
      };
      await this.repository.insertEvent(event, tx);
      await this.repository.insertTicket(
        {
          id: this.uuid(),
          eventId: event.id,
          participant: "Participante demonstrativo",
          issuedAt: this.now().toISOString(),
          usedAt: null,
        },
        tx,
      );
    });
  }
}
