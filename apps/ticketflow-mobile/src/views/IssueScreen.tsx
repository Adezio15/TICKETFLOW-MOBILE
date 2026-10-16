import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useApp } from "../contexts/AppContext";
import {
  Button,
  Chip,
  Field,
  Heading,
  Notice,
  Page,
  styles,
} from "../components/ui";
import { notify } from "../services/native";
import { errorMessage } from "../utils/format";
export default function IssueScreen() {
  const params = useLocalSearchParams<{ eventId?: string }>();
  const {
    controller,
    events,
    selectedEventId,
    selectEvent,
    preferences,
    refresh,
  } = useApp();
  const [eventId, setEventId] = useState(params.eventId ?? selectedEventId);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function issue() {
    if (!controller || !eventId || busy) return;
    setBusy(true);
    setError("");
    try {
      const ticket = await controller.issue(eventId, name);
      await refresh();
      if (preferences.notifications) {
        const warning = await notify(
          "Ingresso emitido",
          `${ticket.participant}, seu ingresso está pronto.`,
        );
        if (warning) Alert.alert("Notificações", warning);
      }
      router.replace({ pathname: "/ticket/[id]", params: { id: ticket.id } });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Heading
        title="Um lugar reservado"
        subtitle="Emita um ingresso individual com QR Code exclusivo."
      />
      <Text style={styles.label}>Selecione o evento</Text>
      <View style={styles.row}>
        {events.map((e) => (
          <Chip
            key={e.id}
            title={e.name}
            selected={eventId === e.id}
            onPress={() => {
              setEventId(e.id);
              selectEvent(e.id);
            }}
          />
        ))}
      </View>
      {!events.length && (
        <Notice>Crie um evento antes de emitir ingressos.</Notice>
      )}
      <Field
        label="Nome do participante"
        value={name}
        onChangeText={setName}
        maxLength={120}
      />
      {error ? <Notice error>{error}</Notice> : null}
      <Button
        title={busy ? "Emitindo…" : "Gerar ingresso"}
        icon="ticket-outline"
        onPress={issue}
        disabled={busy || !eventId}
      />
    </Page>
  );
}
