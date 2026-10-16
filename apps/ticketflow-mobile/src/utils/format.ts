import type { Ticket } from "../models/entities";
export const formatDate = (date: string) =>
  new Date(date).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
export const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Não foi possível concluir. Tente novamente.";
export const ticketPayload = (t: Ticket) =>
  JSON.stringify({
    app: "TicketFlow",
    v: 1,
    ticketId: t.id,
    eventId: t.eventId,
  });
export function parseLocalDate(day: string, time: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(day);
  const clock = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match || !clock)
    throw new Error("Use DD/MM/AAAA para a data e HH:MM para o horário.");
  const [, d, m, y] = match.map(Number);
  const [, h, min] = clock.map(Number);
  const date = new Date(y, m - 1, d, h, min);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d ||
    h > 23 ||
    min > 59
  )
    throw new Error("Data ou horário inválido.");
  return date.toISOString();
}
export function apiDate(day: string): string | null {
  try {
    const d = new Date(parseLocalDate(day, "12:00"));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return null;
  }
}
