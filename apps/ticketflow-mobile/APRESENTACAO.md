# TicketFlow — roteiro de aproximadamente 5 minutos

## Preparação antes da apresentação

- Instale o APK depois de um build EAS concluído, ou prepare o Expo Go compatível com SDK 57 e Metro acessível. Abra o aplicativo antes de começar.
- Use o mesmo aparelho para emitir e validar. Prepare outro celular ou uma impressão para apresentar o QR; como alternativa, copie o código compartilhado e use o campo manual.
- Ative notificações e vibração nas Configurações e conceda câmera/notificações/GPS conforme os recursos que for demonstrar. Confira também uma negativa de permissão sem travar o app.
- Garanta conexão para demonstrar a BrasilAPI. Escolha uma data futura; para feriado, use 25/12 de um ano futuro aceito pela API.
- Deixe o README, os resultados de `npm test` e os links reais do GitHub e do build Expo.dev acessíveis. Se o APK ainda não foi compilado, informe isso explicitamente.

## 0:00–0:40 — Problema e proposta

“Pequenos eventos precisam emitir ingressos e conferir quem já entrou sem planilhas duplicadas. O TicketFlow centraliza eventos, participantes e entrada com QR Code. Este MVP acadêmico funciona em um aparelho com SQLite local.”

Mostre o dashboard. Explique os quatro indicadores e identifique o evento de demonstração. Disponíveis significa ingressos emitidos ainda não utilizados.

## 0:40–1:40 — Criar um evento e demonstrar a API

Toque em **Criar evento**. Preencha um nome, descrição, data futura, horário, local, capacidade **1** e organizador.

Use Natal futuro para mostrar o indicador de carregamento e o nome do feriado retornado pela BrasilAPI. Explique que a requisição é real e que falhas de rede não impedem salvar. Capture GPS se o aparelho estiver pronto; destaque que é opcional e pede autorização.

Salve e abra os detalhes. Mostre a capacidade.

## 1:40–2:25 — Emitir ingresso

Toque em **Emitir ingresso**, digite um participante fictício e gere o ingresso.

Mostre nome, evento, data, UUID e QR. Compartilhe a imagem para o aparelho de apoio, ou compartilhe o texto para copiar o código completo.

Retorne aos detalhes: a capacidade está esgotada e a emissão fica indisponível. Explique que a regra também está no controller e protegida por trigger/transação no banco.

## 2:25–3:25 — Validar e impedir reutilização

Abra **Leitor QR**, selecione o evento e ative a câmera. Leia o QR apresentado no aparelho de apoio. Se só houver um celular, cole o código no campo manual.

Mostre resultado verde e vibração/notificação quando habilitadas. Toque em **Validar próximo ingresso** e repita o mesmo código. Mostre o resultado vermelho de ingresso já utilizado.

“A atualização do ingresso exige que ele ainda esteja pendente. Ela e o registro do histórico são confirmados na mesma transação. Uma segunda leitura não aprova uma segunda entrada.”

Se houver tempo, digite um código inexistente para mostrar a rejeição.

## 3:25–4:10 — Histórico e persistência

Abra **Histórico**, filtre o evento e alterne entre todos, utilizados e pendentes. Mostre participante, emissão e utilização.

Volte ao dashboard e mostre os indicadores atualizados. Feche e reabra o app para mostrar que o SQLite preservou os dados.

“Os aparelhos não sincronizam. A validação deve ocorrer no aparelho emissor. Compartilhar o QR não transfere o banco.”

## 4:10–4:45 — Requisitos técnicos

Abra **Configurações**: marca, modelo, SO, versão e permissões. Mostre o organizador salvo e a preferência de vibração; abra o link do Expo pelo navegador.

Explique: “Os Models descrevem os dados; Controllers concentram regras; Views exibem e recebem interações; Context compartilha estado. Temos Stack e Tabs pelo Expo Router. Preferências usam AsyncStorage; eventos, ingressos e entradas usam SQLite.”

Mostre a árvore `src` no editor se necessário.

## 4:45–5:00 — Verificações e entrega

Mostre `TESTES.md` e os resultados executados. Destaque cobertura de capacidade, dupla utilização, simultaneidade e rollback. Apresente os links reais de GitHub e APK se já estiverem disponíveis.

Diga quais verificações em aparelho você executou. Não apresente bundle JavaScript como APK nem afirme que o build terminou se ainda estiver pendente.

## Plano alternativo

- Sem câmera: valide manualmente pelo UUID completo.
- Sem internet: mostre o erro da BrasilAPI e continue cadastrando; ingresso, histórico e validação são locais.
- Permissão negada: mostre a mensagem e o caminho para os ajustes; GPS é opcional.
- Sem APK pronto: use Expo Go compatível, explique a configuração `preview` e informe que o instalador ainda depende do EAS.
