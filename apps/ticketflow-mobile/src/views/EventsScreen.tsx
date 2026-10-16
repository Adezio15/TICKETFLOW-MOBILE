import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../contexts/AppContext";
import {
  Button,
  Field,
  Heading,
  Notice,
  colors,
  styles,
} from "../components/ui";
import { EventCard } from "../components/EventCard";
export default function EventsScreen() {
  const { events, tickets, refresh } = useApp();
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.content}
      data={events.filter((e) =>
        e.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      )}
      keyExtractor={(e) => e.id}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        refresh()
          .catch(() => setError("Falha ao atualizar."))
          .finally(() => setRefreshing(false));
      }}
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 16 }}>
          <Heading
            title="Eventos"
            subtitle="Organize encontros que merecem acontecer."
          />
          <Button
            title="Novo evento"
            icon="add"
            onPress={() => router.push("/event/new")}
          />
          <Field label="Buscar evento" value={query} onChangeText={setQuery} />
          {error ? <Notice error>{error}</Notice> : null}
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.text}>Nenhum evento encontrado.</Text>
      }
      renderItem={({ item }) => (
        <EventCard
          event={item}
          issued={tickets.filter((t) => t.eventId === item.id).length}
        />
      )}
    />
  );
}
