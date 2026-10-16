import { Tabs } from "expo-router/js-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../components/ui";
const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "grid-outline",
  events: "calendar-outline",
  scan: "qr-code-outline",
  history: "receipt-outline",
  settings: "settings-outline",
};
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerTitle: "TicketFlow",
        headerStyle: { backgroundColor: "white" },
        headerTintColor: colors.navy,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 10 },
        tabBarStyle: { backgroundColor: "white" },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={icons[route.name] ?? "ellipse-outline"}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Início" }} />
      <Tabs.Screen name="events" options={{ title: "Eventos" }} />
      <Tabs.Screen name="scan" options={{ title: "Leitor QR" }} />
      <Tabs.Screen name="history" options={{ title: "Histórico" }} />
      <Tabs.Screen name="settings" options={{ title: "Config." }} />
    </Tabs>
  );
}
