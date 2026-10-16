import { useClock } from "../utils/useClock";
import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useApp } from "../contexts/AppContext";
import { Button, Card, Heading, Notice, Page, styles } from "../components/ui";
import { formatDate } from "../utils/format";
export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, tickets, selectEvent } = useApp();
  const now = useClock();
  const event = events.find((e) => e.id === id);
  if (!event)
    return (
      <Page>
        <Notice error>Evento não encontrado.</Notice>
      </Page>
    );
  const issued = tickets.filter((t) => t.eventId === id);
  const used = issued.filter((t) => t.usedAt).length;
  return (
    <Page>
      <Heading title={event.name} subtitle={formatDate(event.startsAt)} />
      {event.demo === 1 && (
        <Notice>
          Evento e participante demonstrativos, armazenados no SQLite.
        </Notice>
      )}
      <Card>
        <Text style={styles.section}>Sobre o evento</Text>
        <Text style={styles.text}>{event.description}</Text>
        <Text style={styles.text}>Local: {event.location}</Text>
        <Text style={styles.text}>Organização: {event.organizer}</Text>
        {event.latitude !== null && (
          <Text style={styles.small}>
            GPS: {event.latitude}, {event.longitude}
          </Text>
        )}
      </Card>
      <Card>
        <Text style={styles.section}>Participação</Text>
        <Text style={styles.text}>
          {issued.length} / {event.capacity} ingressos emitidos
        </Text>
        <Text style={styles.text}>
          {used} entradas confirmadas · {event.capacity - issued.length} vagas
          para emissão
        </Text>
      </Card>
      <Button
        title="Emitir ingresso"
        icon="ticket-outline"
        disabled={
          issued.length >= event.capacity ||
          new Date(event.startsAt).getTime() <= now
        }
        onPress={() => {
          selectEvent(id);
          router.push({ pathname: "/issue", params: { eventId: id } });
        }}
      />
      <Button
        title="Validar neste evento"
        secondary
        icon="scan-outline"
        onPress={() => {
          selectEvent(id);
          router.navigate("/(tabs)/scan");
        }}
      />
      <Button
        title="Ver histórico deste evento"
        secondary
        onPress={() => {
          selectEvent(id);
          router.navigate("/(tabs)/history");
        }}
      />
    </Page>
  );
}
