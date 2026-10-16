import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { Event } from "../models/entities";
import { colors, styles } from "./ui";
import { formatDate } from "../utils/format";
export function EventCard({
  event,
  issued = 0,
}: {
  event: Event;
  issued?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${event.name}`}
      onPress={() =>
        router.push({ pathname: "/event/[id]", params: { id: event.id } })
      }
      style={styles.card}
    >
      <View style={styles.row}>
        <View
          style={{ backgroundColor: colors.sky, padding: 10, borderRadius: 12 }}
        >
          <Ionicons name="calendar-outline" size={24} color={colors.blue} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.section}>{event.name}</Text>
          <Text style={styles.small}>{formatDate(event.startsAt)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color={colors.muted} />
      </View>
      <Text style={styles.text}>{event.location}</Text>
      <Text style={styles.small}>
        {issued} emitidos · {Math.max(0, event.capacity - issued)} vagas para
        emissão
      </Text>
      {event.demo === 1 && (
        <Text style={[styles.badge, styles.small]}>DADOS DEMONSTRATIVOS</Text>
      )}
    </Pressable>
  );
}
