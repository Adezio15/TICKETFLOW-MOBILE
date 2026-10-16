export interface Event {
  id: string;
  name: string;
  description: string;
  startsAt: string;
  location: string;
  capacity: number;
  organizer: string;
  latitude: number | null;
  longitude: number | null;
  demo: number;
  createdAt: string;
}
export type EventInput = Omit<Event, "id" | "demo" | "createdAt">;
export interface Ticket {
  id: string;
  eventId: string;
  participant: string;
  issuedAt: string;
  usedAt: string | null;
}
export interface TicketHistory extends Ticket {
  eventName: string;
  startsAt: string;
  demo: number;
}
export interface Validation {
  id: string;
  ticketId: string;
  validatedAt: string;
}
export interface ValidationResult {
  ok: boolean;
  message: string;
  ticket?: TicketHistory;
}
export interface Preferences {
  organizer: string;
  notifications: boolean;
  vibration: boolean;
}
export type TicketStatus = "all" | "pending" | "used";
