export interface Holiday {
  date: string;
  name: string;
  type: string;
}
export async function fetchHolidays(
  year: number,
  request: typeof fetch = fetch,
): Promise<Holiday[]> {
  if (!Number.isInteger(year) || year < 1900 || year > 2199)
    throw new Error("Ano fora do intervalo da BrasilAPI (1900–2199).");
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 10000);
  try {
    const response = await request(
      `https://brasilapi.com.br/api/feriados/v1/${year}`,
      { signal: abort.signal },
    );
    if (!response.ok)
      throw new Error(
        `BrasilAPI indisponível (HTTP ${response.status}). Continue sem consultar ou tente novamente.`,
      );
    const data: unknown = await response.json().catch(() => {
      throw new Error(
        "A BrasilAPI retornou JSON inválido. Você pode continuar sem consultar.",
      );
    });
    if (
      !Array.isArray(data) ||
      !data.every(
        (h) =>
          h &&
          typeof h.date === "string" &&
          typeof h.name === "string" &&
          typeof h.type === "string",
      )
    )
      throw new Error(
        "A BrasilAPI retornou dados inválidos. Você pode continuar sem consultar.",
      );
    return data as Holiday[];
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("BrasilAPI") ||
        error.message.startsWith("A BrasilAPI"))
    )
      throw error;
    throw new Error(
      "Sem conexão ou consulta expirada. Verifique a internet. Você pode continuar sem consultar.",
    );
  } finally {
    clearTimeout(timer);
  }
}
