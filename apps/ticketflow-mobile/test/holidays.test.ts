import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchHolidays } from "../src/services/holidays";
test("consulta endpoint real configurado e interpreta feriado retornado (fetch controlado)", async () => {
  let called = "";
  const request: typeof fetch = async (input) => {
    called = String(input);
    return new Response(
      JSON.stringify([{ date: "2030-12-25", name: "Natal", type: "national" }]),
    );
  };
  const rows = await fetchHolidays(2030, request);
  assert.equal(called, "https://brasilapi.com.br/api/feriados/v1/2030");
  assert.equal(rows[0].name, "Natal");
});
test("trata indisponibilidade HTTP da API", async () => {
  await assert.rejects(
    fetchHolidays(2030, async () => new Response("", { status: 503 })),
    /HTTP 503/,
  );
});
test("trata falha de conexão sem bloquear o formulário", async () => {
  await assert.rejects(
    fetchHolidays(2030, async () => {
      throw new TypeError("Failed to fetch");
    }),
    /Sem conexão/,
  );
});
test("rejeita resposta fora do contrato e JSON inválido", async () => {
  await assert.rejects(
    fetchHolidays(2030, async () => new Response("{}")),
    /dados inválidos/,
  );
  await assert.rejects(
    fetchHolidays(2030, async () => new Response('[{"date":"2030-12-25"}]')),
    /dados inválidos/,
  );
  await assert.rejects(
    fetchHolidays(2030, async () => new Response("não é JSON")),
    /JSON inválido/,
  );
});
test("limita ano antes de acessar a API", async () => {
  await assert.rejects(
    fetchHolidays(2200, async () => {
      throw new Error("não deve acessar");
    }),
    /Ano fora/,
  );
});

test("cancela consulta após timeout sem manter requisição pendente", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const request: typeof fetch = async (_input, options) =>
    new Promise((_resolve, reject) => {
      options?.signal?.addEventListener(
        "abort",
        () => reject(new Error("aborted")),
        { once: true },
      );
    });
  const pending = fetchHolidays(2030, request);
  context.mock.timers.tick(10000);
  await assert.rejects(pending, /consulta expirada/);
  context.mock.timers.reset();
});
