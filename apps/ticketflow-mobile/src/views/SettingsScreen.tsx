import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, Switch, Text, View } from "react-native";
import { Camera } from "expo-camera";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import { useApp } from "../contexts/AppContext";
import {
  Button,
  Card,
  Field,
  Heading,
  LocalNotice,
  Notice,
  Page,
  styles,
} from "../components/ui";
import {
  deviceInfo,
  notificationPermission,
  openExternal,
  permissions,
} from "../services/native";
import { errorMessage } from "../utils/format";
export default function SettingsScreen() {
  const { preferences, savePreferences } = useApp();
  const [organizer, setOrganizer] = useState(preferences.organizer);
  const [notification, setNotification] = useState(preferences.notifications);
  const [vibration, setVibration] = useState(preferences.vibration);
  const [permission, setPermission] = useState<Awaited<
    ReturnType<typeof permissions>
  > | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const loadPermissions = useCallback(() => {
    permissions()
      .then(setPermission)
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useFocusEffect(
    useCallback(() => {
      loadPermissions();
    }, [loadPermissions]),
  );
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") loadPermissions();
    });
    return () => sub.remove();
  }, [loadPermissions]);
  async function request(kind: "camera" | "location" | "notification") {
    try {
      setError("");
      if (kind === "camera") await Camera.requestCameraPermissionsAsync();
      if (kind === "location")
        await Location.requestForegroundPermissionsAsync();
      if (kind === "notification") {
        const p = await notificationPermission(true);
        if (!p.granted)
          setError(
            "Notificações não autorizadas. Você pode liberar nos ajustes do aparelho.",
          );
      }
      loadPermissions();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  const label = (status?: string) =>
    status === "granted"
      ? "Autorizada"
      : status === "denied"
        ? "Negada"
        : status === "undetermined"
          ? "Não solicitada"
          : "Carregando";
  return (
    <Page>
      <Heading
        title="Do seu jeito"
        subtitle="Preferências, permissões e informações do aparelho."
      />
      <Card>
        <Text style={styles.section}>Organização e feedback</Text>
        <Field
          label="Nome padrão do organizador"
          value={organizer}
          onChangeText={setOrganizer}
          maxLength={120}
        />
        <View style={[styles.row, { justifyContent: "space-between" }]}>
          <Text style={styles.text}>Notificações locais</Text>
          <Switch
            accessibilityLabel="Notificações locais"
            value={notification}
            onValueChange={setNotification}
          />
        </View>
        <View style={[styles.row, { justifyContent: "space-between" }]}>
          <Text style={styles.text}>Vibrar na validação</Text>
          <Switch
            accessibilityLabel="Vibrar na validação"
            value={vibration}
            onValueChange={setVibration}
          />
        </View>
        <Button
          title={busy ? "Salvando…" : "Salvar preferências"}
          disabled={busy}
          onPress={async () => {
            setBusy(true);
            setError("");
            setMessage("");
            try {
              if (notification) await request("notification");
              await savePreferences({
                organizer: organizer.trim(),
                notifications: notification,
                vibration,
              });
              setMessage("Preferências salvas neste aparelho.");
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        />
      </Card>
      <Card>
        <Text style={styles.section}>Seu dispositivo</Text>
        <Text style={styles.text}>Marca: {deviceInfo.brand}</Text>
        <Text style={styles.text}>Modelo: {deviceInfo.model}</Text>
        <Text style={styles.text}>Sistema: {deviceInfo.os}</Text>
        <Text style={styles.text}>Versão: {deviceInfo.version}</Text>
      </Card>
      <Card>
        <Text style={styles.section}>Permissões</Text>
        {(["camera", "location", "notification"] as const).map((kind, i) => (
          <View key={kind} style={{ gap: 6 }}>
            <Text style={styles.text}>
              {["Câmera", "Localização", "Notificações"][i]}:{" "}
              {label(permission?.[kind])}
            </Text>
            <Button
              title={`Solicitar ${["câmera", "localização", "notificações"][i]}`}
              secondary
              onPress={() => {
                void request(kind);
              }}
            />
          </View>
        ))}
        <Button
          title="Abrir ajustes do aparelho"
          secondary
          onPress={() => {
            Linking.openSettings().catch((e) => setError(errorMessage(e)));
          }}
        />
      </Card>
      {message ? <Notice>{message}</Notice> : null}
      {error ? <Notice error>{error}</Notice> : null}
      <LocalNotice />
      <Button
        title="Documentação oficial do Expo ↗"
        secondary
        icon="open-outline"
        onPress={() => {
          openExternal("https://docs.expo.dev").catch((e) =>
            setError(errorMessage(e)),
          );
        }}
      />
      <Text style={styles.small}>TicketFlow 1.0.0 · MVP acadêmico · SENAC</Text>
    </Page>
  );
}
