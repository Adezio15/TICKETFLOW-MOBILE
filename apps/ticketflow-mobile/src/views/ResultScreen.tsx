import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useApp } from "../contexts/AppContext";
import { Button, Card, Heading, Page, colors, styles } from "../components/ui";
import { formatDate } from "../utils/format";
export default function ResultScreen() {
  const { result } = useApp();
  const ok = result?.ok ?? false;
  return (
    <Page>
      <View
        style={{
          padding: 24,
          alignItems: "center",
          gap: 16,
          backgroundColor: ok ? "#E3F5EB" : "#FCEBED",
          borderRadius: 24,
        }}
      >
        <Ionicons
          name={ok ? "checkmark-circle" : "close-circle"}
          size={90}
          color={ok ? colors.green : colors.red}
        />
        <Heading title={ok ? "Pode entrar!" : "Entrada não aprovada"} />
        <Text
          accessibilityRole="alert"
          style={{
            fontSize: 18,
            textAlign: "center",
            color: ok ? colors.green : colors.red,
          }}
        >
          {result?.message ?? "Nenhuma validação realizada nesta sessão."}
        </Text>
      </View>
      {result?.ticket && (
        <Card>
          <Text style={styles.section}>{result.ticket.participant}</Text>
          <Text style={styles.text}>{result.ticket.eventName}</Text>
          {result.ticket.usedAt && (
            <Text style={styles.small}>
              Utilizado em {formatDate(result.ticket.usedAt)}
            </Text>
          )}
          <Text selectable style={styles.small}>
            {result.ticket.id}
          </Text>
        </Card>
      )}
      <Button
        title="Validar próximo ingresso"
        icon="scan-outline"
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace("/(tabs)/scan");
        }}
      />
      <Button
        title="Consultar histórico"
        secondary
        onPress={() => router.replace("/(tabs)/history")}
      />
    </Page>
  );
}
