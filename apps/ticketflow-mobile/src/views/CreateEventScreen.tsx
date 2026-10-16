import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../contexts/AppContext";
import {
  Button,
  Card,
  Field,
  Heading,
  Notice,
  Page,
  styles,
} from "../components/ui";
import { fetchHolidays } from "../services/holidays";
import { coordinates } from "../services/native";
import { apiDate, errorMessage, parseLocalDate } from "../utils/format";
export default function CreateEventScreen() {
  const { controller, preferences, refresh } = useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [organizer, setOrganizer] = useState(preferences.organizer);
  const [gps, setGps] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lookup, setLookup] = useState<{
    date: string;
    message: string;
    error: boolean;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const isoDate = apiDate(date);
  const apiBusy = !!isoDate && lookup?.date !== isoDate;
  const apiError = !!isoDate && lookup?.date === isoDate && lookup.error;
  const holiday = isoDate
    ? lookup?.date === isoDate
      ? lookup.message
      : "Consultando BrasilAPI…"
    : "Informe uma data válida para consultar feriados.";
  useEffect(() => {
    let active = true;
    if (!isoDate) return;
    const timer = setTimeout(() => {
      fetchHolidays(Number(isoDate.slice(0, 4)))
        .then((rows) => {
          const match = rows.find((h) => h.date === isoDate);
          if (active)
            setLookup({
              date: isoDate,
              error: false,
              message: match
                ? `Esta data corresponde a um feriado nacional: ${match.name}.`
                : "Esta data não coincide com um feriado nacional retornado pela BrasilAPI.",
            });
        })
        .catch((e) => {
          if (active)
            setLookup({ date: isoDate, error: true, message: errorMessage(e) });
        });
    }, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isoDate, retry]);
  async function save() {
    if (!controller || busy) return;
    setBusy(true);
    setError("");
    try {
      const event = await controller.createEvent({
        name,
        description,
        startsAt: parseLocalDate(date, time),
        location,
        capacity: Number(capacity),
        organizer,
        latitude: gps?.latitude ?? null,
        longitude: gps?.longitude ?? null,
      });
      await refresh();
      router.replace({ pathname: "/event/[id]", params: { id: event.id } });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Heading
        title="Um novo encontro"
        subtitle="Preencha os detalhes e comece a receber participantes."
      />
      <Card>
        <Field
          label="Nome do evento *"
          value={name}
          onChangeText={setName}
          maxLength={120}
        />
        <Field
          label="Descrição *"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={2000}
        />
        <Field
          label="Data * (DD/MM/AAAA)"
          value={date}
          onChangeText={setDate}
          placeholder="25/12/2026"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        <Field
          label="Horário * (HH:MM)"
          value={time}
          onChangeText={setTime}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />
        <Notice error={apiError}>
          {apiBusy ? "Consultando BrasilAPI…" : holiday}
        </Notice>
        {apiBusy && <ActivityIndicator />}
        {apiError && (
          <Button
            title="Tentar consulta novamente"
            secondary
            onPress={() => {
              setLookup(null);
              setRetry((n) => n + 1);
            }}
          />
        )}
        <Field
          label="Local *"
          value={location}
          onChangeText={setLocation}
          maxLength={200}
        />
        <Field
          label="Capacidade máxima *"
          value={capacity}
          onChangeText={setCapacity}
          keyboardType="number-pad"
          maxLength={7}
        />
        <Field
          label="Organizador *"
          value={organizer}
          onChangeText={setOrganizer}
          maxLength={120}
        />
      </Card>
      <Card>
        <Text style={styles.section}>Localização opcional</Text>
        <Text style={styles.small}>
          Capture as coordenadas quando estiver no local do evento.
        </Text>
        {gps && (
          <View>
            <Text style={styles.text}>
              {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
            </Text>
            <Button
              title="Remover coordenadas"
              secondary
              onPress={() => setGps(null)}
            />
          </View>
        )}
        <Button
          title={gpsBusy ? "Obtendo GPS…" : "Usar localização atual"}
          secondary
          icon="location-outline"
          disabled={gpsBusy}
          onPress={() => {
            setGpsBusy(true);
            coordinates()
              .then(setGps)
              .catch((e) => setError(errorMessage(e)))
              .finally(() => setGpsBusy(false));
          }}
        />
      </Card>
      {error ? <Notice error>{error}</Notice> : null}
      <Button
        title={busy ? "Salvando…" : "Criar evento"}
        onPress={save}
        disabled={busy}
      />
      <Text style={styles.small}>
        * Campos obrigatórios. A consulta de feriados é informativa e não impede
        o cadastro.
      </Text>
    </Page>
  );
}
