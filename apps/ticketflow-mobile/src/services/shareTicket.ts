import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
export async function shareTicketImage(id: string, base64: string) {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error(
      "Compartilhamento de imagem indisponível. Use o botão de compartilhar código.",
    );
  const file = new File(Paths.cache, `ticketflow-${id}.png`);
  try {
    file.create({ overwrite: true });
    file.write(base64, { encoding: "base64" });
    await Sharing.shareAsync(file.uri, {
      mimeType: "image/png",
      dialogTitle: "Compartilhar ingresso TicketFlow",
      UTI: "public.png",
    });
  } finally {
    if (file.exists) file.delete();
  }
}
