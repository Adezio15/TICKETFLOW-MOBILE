import { fetchHolidays } from "../src/services/holidays";
async function main() {
  const rows = await fetchHolidays(2026);
  console.log(
    JSON.stringify(
      {
        endpoint: "https://brasilapi.com.br/api/feriados/v1/2026",
        count: rows.length,
        christmas: rows.find((h) => h.date === "2026-12-25"),
      },
      null,
      2,
    ),
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
