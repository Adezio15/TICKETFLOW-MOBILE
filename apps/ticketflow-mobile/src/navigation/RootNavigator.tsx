import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useApp } from "../contexts/AppContext";
import { Busy, Button, Heading, Notice, Page, colors } from "../components/ui";
export function RootNavigator() {
  const { loading, error, retry } = useApp();
  if (loading)
    return (
      <Page>
        <Heading
          title="TicketFlow"
          subtitle="Preparando seus eventos e ingressos…"
        />
        <Busy />
      </Page>
    );
  if (error)
    return (
      <Page>
        <Heading title="Não foi possível abrir o banco" />
        <Notice error>{error}</Notice>
        <Button title="Tentar novamente" onPress={retry} />
      </Page>
    );
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "white" },
          headerTintColor: colors.navy,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="event/new" options={{ title: "Criar evento" }} />
        <Stack.Screen
          name="event/[id]"
          options={{ title: "Detalhes do evento" }}
        />
        <Stack.Screen name="issue" options={{ title: "Emitir ingresso" }} />
        <Stack.Screen
          name="ticket/[id]"
          options={{ title: "Ingresso digital" }}
        />
        <Stack.Screen
          name="result"
          options={{ title: "Resultado da validação", gestureEnabled: false }}
        />
      </Stack>
    </>
  );
}
