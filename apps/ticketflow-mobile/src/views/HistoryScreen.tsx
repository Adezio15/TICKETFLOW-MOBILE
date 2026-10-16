import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../contexts/AppContext";
import type { TicketStatus } from "../models/entities";
import { Chip, Heading, Notice, colors, styles } from "../components/ui";
import { formatDate } from "../utils/format";
export default function HistoryScreen() {
  const { events, tickets, selectedEventId, selectEvent, refresh } = useApp();
  const [status, setStatus] = useState<TicketStatus>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const filtered = tickets.filter(
    (t) =>
      (!selectedEventId || t.eventId === selectedEventId) &&
      (status === "all" || (status === "used" ? !!t.usedAt : !t.usedAt)),
  );
  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.content}
      data={filtered}
      keyExtractor={(t) => t.id}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        refresh()
          .catch(() => setError("Falha ao atualizar histórico."))
          .finally(() => setRefreshing(false));
      }}
      ListHeaderComponent={
        <View style={{ gap: 14, marginBottom: 16 }}>
          <Heading
            title="Cada ingresso, uma história"
            subtitle="Emissões e entradas registradas neste aparelho."
          />
          <View style={styles.row}>
            {(
              [
                ["all", "Todos"],
                ["pending", "Pendentes"],
                ["used", "Utilizados"],
              ] as const
            ).map(([value, label]) => (
              <Chip
                key={value}
                title={label}
                selected={status === value}
                onPress={() => setStatus(value)}
              />
            ))}
          </View>
          <Text style={styles.label}>Filtrar por evento</Text>
          <View style={styles.row}>
            <Chip
              title="Todos os eventos"
              selected={!selectedEventId}
              onPress={() => selectEvent(undefined)}
            />
            {events.map((e) => (
              <Chip
                key={e.id}
                title={e.name}
                selected={selectedEventId === e.id}
                onPress={() => selectEvent(e.id)}
              />
            ))}
          </View>
          <Text style={styles.small}>
            {filtered.length} ingresso(s) encontrado(s). Toque para abrir.
          </Text>
          {error ? <Notice error>{error}</Notice> : null}
        </View>
      }
      ListEmptyComponent={
        <Notice>
          Nenhum ingresso corresponde aos filtros. Emita um ingresso na tela de
          detalhes do evento.
        </Notice>
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Abrir ingresso de ${item.participant}`}
          style={styles.card}
          onPress={() =>
            router.push({ pathname: "/ticket/[id]", params: { id: item.id } })
          }
        >
          <Text style={styles.section}>{item.participant}</Text>
          <Text style={styles.text}>{item.eventName}</Text>
          <Text
            style={{
              color: item.usedAt ? colors.green : colors.blue,
              fontWeight: "700",
            }}
          >
            {item.usedAt ? "UTILIZADO" : "PENDENTE"}
          </Text>
          <Text style={styles.small}>
            Emitido em {formatDate(item.issuedAt)}
          </Text>
          <Text style={styles.small}>
            {item.usedAt
              ? `Utilizado em ${formatDate(item.usedAt)}`
              : "Ainda não utilizado"}
          </Text>
          {item.demo === 1 && (
            <Text style={styles.small}>Dados demonstrativos</Text>
          )}
        </Pressable>
      )}
    />
  );
}
