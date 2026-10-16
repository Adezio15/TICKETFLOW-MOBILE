import { useRef, useState } from "react";
import { Share, Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
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
import { errorMessage, formatDate, ticketPayload } from "../utils/format";
import { shareTicketImage } from "../services/shareTicket";
interface QRRef {
  toDataURL: (callback: (base64: string) => void) => void;
}
export default function TicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tickets } = useApp();
  const ticket = tickets.find((t) => t.id === id);
  const qrRef = useRef<QRRef | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { width } = useWindowDimensions();
  if (!ticket)
    return (
      <Page>
        <Notice error>Ingresso não encontrado neste aparelho.</Notice>
      </Page>
    );
  const payload = ticketPayload(ticket);
  async function shareImage() {
    if (!ticket || !qrRef.current || busy) return;
    setBusy(true);
    setError("");
    try {
      const base64 = await new Promise<string>((resolve) =>
        qrRef.current!.toDataURL(resolve),
      );
      await shareTicketImage(ticket.id, base64);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Heading
        title="Seu ingresso está aqui"
        subtitle="Um código exclusivo. Uma entrada."
      />
      <Card>
        <Text
          style={[
            styles.small,
            { color: colors.blue, fontWeight: "800", letterSpacing: 2 },
          ]}
        >
          TICKETFLOW / INGRESSO DIGITAL
        </Text>
        <Text style={styles.title}>{ticket.participant}</Text>
        <Text style={styles.section}>{ticket.eventName}</Text>
        <Text style={styles.text}>{formatDate(ticket.startsAt)}</Text>
        <View
          style={{
            alignItems: "center",
            paddingVertical: 24,
            backgroundColor: "white",
          }}
        >
          <QRCode
            value={payload}
            size={Math.min(240, width - 100)}
            quietZone={12}
            color={colors.navy}
            getRef={(ref) => {
              qrRef.current = ref;
            }}
          />
        </View>
        <Text
          selectable
          style={[
            styles.small,
            { textAlign: "center", fontFamily: "monospace" },
          ]}
        >
          {ticket.id}
        </Text>
        <Notice error={!!ticket.usedAt}>
          {ticket.usedAt
            ? `Utilizado em ${formatDate(ticket.usedAt)}`
            : "Pendente · apresente o QR Code na entrada"}
        </Notice>
        {ticket.demo === 1 && (
          <Text style={styles.small}>Ingresso de evento demonstrativo.</Text>
        )}
      </Card>
      {error ? <Notice error>{error}</Notice> : null}
      <Button
        title={busy ? "Preparando imagem…" : "Compartilhar QR Code (imagem)"}
        icon="share-outline"
        onPress={shareImage}
        disabled={busy}
      />
      <Button
        title="Compartilhar dados e código"
        secondary
        onPress={() => {
          Share.share({
            message: `TicketFlow\n${ticket.participant}\n${ticket.eventName}\n${formatDate(ticket.startsAt)}\nCódigo: ${ticket.id}\nQR: ${payload}\nVálido somente no aparelho emissor.`,
          }).catch((e) => setError(errorMessage(e)));
        }}
      />
      <LocalNotice />
    </Page>
  );
}
