import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Camera } from "expo-camera";
import { Linking, Platform } from "react-native";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
export const deviceInfo = {
  brand: Device.brand ?? "Não informada",
  model: Device.modelName ?? "Não informado",
  os: Device.osName ?? Platform.OS,
  version: Device.osVersion ?? String(Platform.Version),
};
export async function coordinates() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      "Localização não autorizada. O cadastro pode continuar sem GPS.",
    );
  if (!(await Location.hasServicesEnabledAsync()))
    throw new Error("Ative o GPS do aparelho ou continue sem localização.");
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}
export async function notificationPermission(request = false) {
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("ticketflow", {
      name: "Ingressos e entradas",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  return request
    ? Notifications.requestPermissionsAsync()
    : Notifications.getPermissionsAsync();
}
export async function notify(
  title: string,
  body: string,
): Promise<string | null> {
  try {
    const permission = await notificationPermission();
    if (!permission.granted)
      return "Notificação não enviada: permissão não concedida.";
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
    return null;
  } catch {
    return "Operação salva. Não foi possível exibir a notificação neste dispositivo.";
  }
}
export async function permissions() {
  const [camera, location, notification] = await Promise.all([
    Camera.getCameraPermissionsAsync(),
    Location.getForegroundPermissionsAsync(),
    Notifications.getPermissionsAsync(),
  ]);
  return {
    camera: camera.status,
    location: location.status,
    notification: notification.status,
  };
}
export async function openExternal(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    throw new Error(
      "Não foi possível abrir o link. Verifique se há um navegador instalado.",
    );
  }
}
