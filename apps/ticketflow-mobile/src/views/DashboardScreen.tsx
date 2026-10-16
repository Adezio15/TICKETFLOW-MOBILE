import { useClock } from "../utils/useClock";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../contexts/AppContext";
import {
  Button,
  Card,
  Heading,
  LocalNotice,
  Notice,
  Page,
  colors,
  styles,
} from "../components/ui";
import { EventCard } from "../components/EventCard";
export default function DashboardScreen() {
  const { events, tickets, warning } = useApp();
  const used = tickets.filter((t) => t.usedAt).length;
  const stats = [
    ["Eventos", events.length],
    ["Emitidos", tickets.length],
    ["Utilizados", used],
    ["Disponíveis", tickets.length - used],
  ] as const;
  const now = useClock();
  const upcoming = events
    .filter((e) => new Date(e.startsAt).getTime() > now)
    .slice(0, 3);
  return (
    <Page>
      <Heading
        title={"Seu evento.\nTudo sob controle."}
        subtitle="Da emissão à entrada, acompanhe cada ingresso."
      />
      {warning && <Notice>{warning}</Notice>}
      <View style={styles.row}>
        {stats.map(([name, value]) => (
          <View key={name} style={[styles.card, { width: "47%", flexGrow: 1 }]}>
            <Text
              style={{ fontSize: 32, fontWeight: "800", color: colors.navy }}
            >
              {value}
            </Text>
            <Text style={styles.subtitle}>{name}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.small}>
        Disponíveis = ingressos emitidos que ainda não foram utilizados.
      </Text>
      <Button
        title="Criar evento"
        icon="add-circle-outline"
        onPress={() => router.push("/event/new")}
      />
      <Button
        title="Validar entrada"
        secondary
        icon="scan-outline"
        onPress={() => router.navigate("/(tabs)/scan")}
      />
      <Text style={styles.section}>Próximos eventos</Text>
      {upcoming.length ? (
        upcoming.map((e) => (
          <EventCard
            key={e.id}
            event={e}
            issued={tickets.filter((t) => t.eventId === e.id).length}
          />
        ))
      ) : (
        <Card>
          <Text style={styles.text}>
            Nenhum evento futuro. Crie seu próximo encontro.
          </Text>
        </Card>
      )}
      <LocalNotice />
    </Page>
  );
}
