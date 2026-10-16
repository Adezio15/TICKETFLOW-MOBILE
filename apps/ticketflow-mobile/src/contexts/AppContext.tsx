import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createExpoDatabase } from "../database/expoDatabase";
import { randomUUID } from "expo-crypto";
import { Repository } from "../database/repository";
import { TicketFlowController } from "../controllers/ticketFlowController";
import type {
  Event,
  Preferences,
  TicketHistory,
  ValidationResult,
} from "../models/entities";
import { errorMessage } from "../utils/format";
const defaults: Preferences = {
  organizer: "",
  notifications: false,
  vibration: true,
};
const preferenceKey = "@ticketflow/preferences/v1";
let servicePromise: Promise<TicketFlowController> | undefined;
function service() {
  if (!servicePromise)
    servicePromise = (async () => {
      const db = await createExpoDatabase();
      const repo = new Repository(db);
      await repo.initialize();
      const controller = new TicketFlowController(repo, randomUUID);
      await controller.seed();
      return controller;
    })().catch((error) => {
      servicePromise = undefined;
      throw error;
    });
  return servicePromise;
}
interface AppState {
  controller: TicketFlowController | null;
  events: Event[];
  tickets: TicketHistory[];
  preferences: Preferences;
  selectedEventId: string | undefined;
  selectEvent: (id?: string) => void;
  loading: boolean;
  error: string | null;
  warning: string | null;
  refresh: () => Promise<void>;
  retry: () => void;
  savePreferences: (next: Preferences) => Promise<void>;
  result: ValidationResult | null;
  setResult: (r: ValidationResult) => void;
}
const Context = createContext<AppState | null>(null);
export function AppProvider({ children }: PropsWithChildren) {
  const [controller, setController] = useState<TicketFlowController | null>(
    null,
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<TicketHistory[]>([]);
  const [preferences, setPreferences] = useState(defaults);
  const [selectedEventId, selectEvent] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<ValidationResult | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      const api = await service();
      const [eventRows, ticketRows] = await Promise.all([
        api.repository.events(),
        api.repository.history(),
      ]);
      let prefs = defaults;
      try {
        const raw = await AsyncStorage.getItem(preferenceKey);
        if (raw) {
          const data: unknown = JSON.parse(raw);
          if (
            data &&
            typeof data === "object" &&
            "organizer" in data &&
            typeof data.organizer === "string" &&
            "notifications" in data &&
            typeof data.notifications === "boolean" &&
            "vibration" in data &&
            typeof data.vibration === "boolean"
          )
            prefs = data as Preferences;
          else throw new Error();
        }
      } catch {
        if (active)
          setWarning(
            "Preferências não carregadas. Os ingressos continuam preservados no SQLite.",
          );
      }
      if (active) {
        setController(api);
        setEvents(eventRows);
        setTickets(ticketRows);
        setPreferences(prefs);
      }
    })()
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const refresh = useCallback(async () => {
    if (!controller) return;
    const [es, ts] = await Promise.all([
      controller.repository.events(),
      controller.repository.history(),
    ]);
    setEvents(es);
    setTickets(ts);
  }, [controller]);
  const savePreferences = async (next: Preferences) => {
    await AsyncStorage.setItem(preferenceKey, JSON.stringify(next));
    setPreferences(next);
  };
  return (
    <Context.Provider
      value={{
        controller,
        events,
        tickets,
        preferences,
        selectedEventId,
        selectEvent,
        loading,
        error,
        warning,
        refresh,
        retry: () => {
          setLoading(true);
          setError(null);
          setAttempt((x) => x + 1);
        },
        savePreferences,
        result,
        setResult,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("AppProvider ausente.");
  return ctx;
}
