import { useCallback, useRef, useState } from "react";
import { Alert, Linking, Text, Vibration, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect, useIsFocused } from "expo-router";
import { useApp } from "../contexts/AppContext";
import {
  Button,
  Chip,
  Field,
  Heading,
  LocalNotice,
  Notice,
  Page,
  styles,
} from "../components/ui";
import { notify } from "../services/native";
import { errorMessage } from "../utils/format";
export default function ScanScreen() {
  const {
    controller,
    events,
    selectedEventId,
    selectEvent,
    preferences,
    setResult,
    refresh,
  } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const focused = useIsFocused();
  const locked = useRef(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  useFocusEffect(
    useCallback(() => {
      locked.current = false;
      setBusy(false);
      return () => {
        locked.current = true;
      };
    }, []),
  );
  async function validate(raw: string) {
    if (!controller || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await controller.validate(raw, selectedEventId);
      if (preferences.vibration)
        Vibration.vibrate(result.ok ? 150 : [0, 180, 120, 180]);
      setResult(result);
      await refresh();
      if (result.ok && preferences.notifications) {
        const warning = await notify(
          "Entrada confirmada",
          result.ticket?.participant ?? "Ingresso validado",
        );
        if (warning) Alert.alert("Notificações", warning);
      }
      setCode("");
      router.push("/result");
    } catch (e) {
      setError(errorMessage(e));
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <Page>
      <Heading
        title="Entrada, por favor"
        subtitle="Leia o QR Code ou informe o código do ingresso."
      />
      <LocalNotice />
      <Text style={styles.label}>Evento da portaria</Text>
      <View style={styles.row}>
        <Chip
          title="Qualquer evento local"
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
      {permission?.granted && cameraOn && focused && !busy ? (
        <View style={{ height: 280, borderRadius: 20, overflow: "hidden" }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => {
              void validate(data);
            }}
          />
        </View>
      ) : (
        <Notice>
          {permission?.granted
            ? "Toque em ativar câmera para começar a leitura."
            : "Autorize a câmera para ler QR Codes. A validação manual continua disponível."}
        </Notice>
      )}
      <Button
        title={cameraOn ? "Pausar câmera" : "Ativar câmera"}
        secondary
        icon="camera-outline"
        disabled={busy}
        onPress={async () => {
          try {
            if (permission?.granted) setCameraOn((v) => !v);
            else {
              const result = await requestPermission();
              if (result.granted) setCameraOn(true);
              else
                setError(
                  "Câmera não autorizada. Digite o código ou libere a permissão nos ajustes.",
                );
            }
          } catch (e) {
            setError(errorMessage(e));
          }
        }}
      />
      {permission && !permission.granted && !permission.canAskAgain && (
        <Button
          title="Abrir ajustes do aparelho"
          secondary
          onPress={() => {
            Linking.openSettings().catch((e) => setError(errorMessage(e)));
          }}
        />
      )}
      <Field
        label="Código do ingresso ou conteúdo do QR"
        value={code}
        onChangeText={setCode}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={600}
      />
      {error ? <Notice error>{error}</Notice> : null}
      <Button
        title={busy ? "Validando…" : "Validar código"}
        disabled={busy || !code.trim()}
        onPress={() => {
          void validate(code);
        }}
      />
    </Page>
  );
}
