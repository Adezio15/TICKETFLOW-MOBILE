# TicketFlow Mobile

Aplicativo mobile acadêmico do SENAC para gerenciar eventos, emitir ingressos digitais e controlar entradas. Desenvolvido com React Native, Expo SDK 57 e TypeScript, com arquitetura MVC e dados locais em SQLite.

## Problema, público e solução

Pequenos organizadores, escolas e equipes de recepção precisam controlar lotação e evitar que o mesmo ingresso seja utilizado duas vezes. O TicketFlow reúne cadastro, emissão com QR Code e validação em um aparelho, sem exigir servidor ou login. O público-alvo são organizadores de eventos pequenos e demonstrações acadêmicas.

**O banco é local. Não há sincronização entre aparelhos.** O aparelho que emite deve validar os ingressos. O participante pode receber a imagem do QR e apresentá-la em outro celular ou impressa; isso não copia o banco do organizador. Instalar o aplicativo em outra portaria não transfere os ingressos. Desinstalar o aplicativo ou limpar seus dados pode apagar o banco e as preferências.

## Funcionalidades

- Dashboard com total de eventos, emitidos, utilizados, pendentes disponíveis e próximos eventos, calculados a partir dos registros do SQLite.
- Cadastro de nome, descrição, data e horário locais, local, capacidade, organizador e coordenadas opcionais; rejeita datas inexistentes, passadas e capacidades inválidas.
- Listagem, busca e detalhes de eventos; contador de vagas restantes.
- Emissão individual com UUID, QR Code contendo evento e ingresso, bloqueio de lotação e compartilhamento de QR em PNG ou texto com dados do ingresso.
- Leitura com câmera ou código digitado, seleção de evento da portaria, resultado verde/vermelho e vibração configurável.
- Validação atômica: atualização condicional de ingresso e registro da utilização na mesma transação. Bloqueia reutilização no mesmo banco, inclusive solicitações simultâneas.
- Histórico com participante, evento, emissão, utilização e filtros por evento/situação.
- Preferências e nome padrão do organizador persistidos com AsyncStorage; seleção de evento compartilhada pela Context API.
- Consulta real de feriados na BrasilAPI com carregamento, timeout, erros de rede/HTTP e tentativa novamente. O cadastro continua disponível sem consulta.
- GPS opcional, permissões explícitas, informações do aparelho, notificações locais e link externo do Expo com tratamento de erro.
- Evento e participante de demonstração criados somente quando não há eventos, identificados na interface.

## Tecnologias

React Native 0.86, React 19.2, Expo SDK 57, TypeScript, Expo Router (Stack e JavaScript Bottom Tabs), expo-sqlite, expo-camera, expo-location, expo-notifications, expo-device, expo-crypto, expo-file-system, expo-sharing, expo-font, expo-splash-screen, React Native SVG/QRCode e AsyncStorage. Componentes nativos incluem TextInput, Pressable, FlatList, Switch, ActivityIndicator, Vibration, Share, Linking e Platform. As telas usam useState/useEffect para estado, consulta de API, permissões e inicialização.

## Estrutura e arquitetura MVC

```text
apps/ticketflow-mobile/
├── src/
│   ├── app/                   Rotas Expo Router e layouts de navegação
│   │   ├── (tabs)/            Início, eventos, leitor, histórico, configurações
│   │   ├── event/             new e [id]
│   │   ├── ticket/[id].tsx    Ingresso digital
│   │   ├── issue.tsx          Emissão
│   │   └── result.tsx         Resultado da validação
│   ├── models/entities.ts     Event, Ticket, Validation e tipos compartilhados
│   ├── database/             Schema, repositório SQL e adaptador expo-sqlite
│   ├── controllers/          Regras de cadastro, emissão, validação e demonstração
│   ├── contexts/             Inicialização, dados e preferências globais
│   ├── navigation/           Stack principal
│   ├── views/                Telas de apresentação e interação
│   ├── components/           UI, cards, campos e avisos reutilizáveis
│   ├── services/             BrasilAPI, GPS, notificações, aparelho e compartilhamento
│   └── utils/                Datas, payload QR, erros e relógio das telas
├── test/                     Regras de negócio e falhas de API
├── scripts/check-api.ts       Consulta de integração real
├── assets/                   Ícone TicketFlow e tela de abertura
├── app.json                  Configuração Expo e permissões
├── eas.json                  Perfil preview para APK
├── README.md
├── APRESENTACAO.md
└── TESTES.md
```

**Model:** entidades tipadas e repositório que acessa o SQLite. **Controller:** valida campos, lotação, identificação do QR e transações de utilização. **View:** telas React Native recebem os dados pela Context API e chamam os controllers. O Context fornece estado e serviços, sem substituir as regras dos controllers. As rotas apenas conectam as telas à navegação. Expo Router implementa Stack Navigation e Tab Navigation; o layout das abas está em `src/app/(tabs)/_layout.tsx` e a pilha em `src/navigation/RootNavigator.tsx`.

Fluxo de chamada: `View → Controller → Repository → SQLite`. Retorno dos dados: `SQLite → Context → View`.

## Telas e fluxo de utilização

```text
Stack principal
├── Tabs
│   ├── Início → Criar evento / Detalhes / Leitor QR
│   ├── Eventos → Criar evento / Detalhes
│   ├── Leitor QR → Resultado da validação → Próximo ingresso / Histórico
│   ├── Histórico → Visualizar ingresso
│   └── Configurações → Preferências, permissões, dispositivo, documentação
├── Criar evento → Detalhes
├── Detalhes → Emitir ingresso / Leitor QR / Histórico do evento
├── Emitir ingresso → Visualizar ingresso
├── Visualizar ingresso → Compartilhar imagem / Compartilhar texto
└── Resultado da validação
```

1. Abra o aplicativo; o banco é inicializado automaticamente. No primeiro uso haverá um evento demonstrativo para uma semana após a abertura e um ingresso pendente.
2. Em Configurações, salve o organizador padrão e as preferências. Ative notificações e autorize a permissão caso queira demonstrar esse recurso.
3. Crie um evento futuro. Digite a data em `DD/MM/AAAA` e a hora em `HH:MM`, no fuso local do aparelho. Para demonstrar a API, selecione um Natal futuro e aguarde a resposta real. A consulta não é obrigatória para salvar.
4. Opcionalmente, estando no local, capture as coordenadas. Sem permissão de GPS, continue sem localização.
5. Abra os detalhes, emita um ingresso com nome do participante e compartilhe o QR por imagem. O compartilhamento de texto inclui também o código manual completo.
6. Apresente o QR em outro celular ou numa impressão e leia no aparelho emissor. Para demonstrar usando apenas um aparelho, compartilhe o código, copie-o e cole no campo manual do leitor.
7. Confirme a entrada e tente ler/digitar novamente: a segunda tentativa deve ser recusada.
8. Confira histórico, filtros e indicadores; feche e reabra o aplicativo para verificar persistência.

A validação permite entradas antecipadas; este MVP não impõe uma janela de horário para check-in. A emissão é bloqueada após o início do evento.

## SQLite e integridade

Banco exclusivo `ticketflow-v1.db`, aberto pelo expo-sqlite no armazenamento do aplicativo. Não usa bancos, credenciais ou variáveis de outros sistemas.

- `eventos`: identidade, nome, descrição, data ISO, local, capacidade, organizador, latitude/longitude, marca demonstrativa e criação.
- `ingressos`: UUID, chave estrangeira do evento, participante, emissão e utilização opcional.
- `validacoes`: UUID, ingresso único e horário de validação. Esta tabela registra entradas aprovadas; recusas não são persistidas.
- Índices para data de evento, evento do ingresso e situação. Trigger adicional impede ultrapassar a capacidade mesmo em inserções diretas.
- Consultas com parâmetros. DDL é estático. Inicialização idempotente com `user_version = 1`, WAL e chaves estrangeiras.
- Escritas passam por uma fila no repositório e uma conexão exclusiva com `PRAGMA foreign_keys = ON`, `busy_timeout` e `BEGIN IMMEDIATE` antes das consultas de capacidade/validação.
- Utilização executa `UPDATE ingressos SET usedAt = ? WHERE id = ? AND usedAt IS NULL`; exige exatamente uma linha e registra a validação antes de `COMMIT`. Erros causam `ROLLBACK`.
- Preferências ficam em uma chave própria `@ticketflow/preferences/v1` no AsyncStorage. Evento selecionado e último resultado ficam em memória no Context.

## BrasilAPI

Endpoint: `https://brasilapi.com.br/api/feriados/v1/{ano}`. Documentação: https://brasilapi.com.br/docs#tag/Feriados-Nacionais

A tela de cadastro usa fetch, debounce de 500 ms e timeout de 10 segundos com AbortController. Compara a data local em `AAAA-MM-DD` com os feriados nacionais. Exibe carregamento, feriado encontrado, ausência de coincidência ou erro. Retornos HTTP e JSON inválido são tratados; falha de rede/timeout informa que é possível continuar. Não há respostas fictícias no aplicativo. Os testes unitários usam fetch controlado; `npm run test:api` faz uma chamada real separada.

## Recursos nativos e permissões

| Recurso       | Uso funcional                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Câmera        | CameraView lê apenas QR; solicita permissão ao ativar e desmonta ao sair da tela               |
| GPS           | Captura opcional das coordenadas, somente em primeiro plano                                    |
| Vibração      | Padrões diferentes para entrada aprovada e recusada; preferência configurável                  |
| Notificação   | Aviso local ao emitir ou aprovar uma entrada, se preferência e permissão estiverem habilitadas |
| Aparelho      | Marca, modelo, SO e versão via expo-device e Platform                                          |
| Linking       | Documentação oficial no navegador e ajustes do sistema                                         |
| Share/Sharing | Compartilhamento de dados/código e imagem PNG do QR                                            |

Nenhuma notificação remota/push, conta Expo ou token FCM é necessário para a lógica local. O APK é a referência para validar comportamento nativo. Permissões negadas mantêm cadastro sem GPS e leitura manual disponíveis.

## Instalação e execução

Pré-requisitos: Node.js **22.13 ou superior** (testes SQLite exigem Node com `node:sqlite`; ambiente de desenvolvimento validado com Node 26.1), npm e Android físico ou emulador. Não são necessárias variáveis de ambiente.

```powershell
cd apps/ticketflow-mobile
npm ci
npm start
```

Use um Expo Go compatível com o SDK 57 ou um build nativo compatível. Celular e computador devem conseguir acessar o mesmo servidor Metro. Se o Expo Go instalado não suportar o SDK, utilize o APK preparado pelo EAS. Para iniciar em emulador Android já configurado: `npm run android`. O alvo entregue é **Android**; não há suporte web configurado, e o runtime de transação exclusiva é nativo.

```powershell
npm run typecheck
npm run lint
npm test
npx expo install --check
npx expo-doctor
npm run test:api
npx expo export --platform android --output-dir dist --max-workers 2
```

O último comando gera bundle/recursos JavaScript; **não é um APK**. Resultados e pendências estão em `TESTES.md`.

## Gerar APK Android com EAS

O perfil `preview` em `eas.json` usa `distribution: internal` e `android.buildType: apk`. Nome, ícone, plugins e permissões estão em `app.json`. Identificador Android: `br.com.senac.ticketflow.a92319672` (troque somente se esse identificador já estiver em uso na sua conta).

Nenhum build remoto, deploy, push ou publicação foi executado. Não há um APK ou link Expo.dev de instalador gerado nesta entrega.

Quando você decidir compilar, execute na pasta do aplicativo:

```powershell
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile preview
```

O `eas init` associa o aplicativo à SUA conta e grava o `extra.eas.projectId` real; não há identificador de projeto inventado nem credenciais reaproveitadas. Se perguntado, aceite criar/gerenciar a chave Android na sua conta. O EAS pode ter fila ou limites de plano. Aguarde o build terminar com sucesso. Não execute `eas submit` para esta apresentação.

Depois do sucesso, abra a página do build fornecida pelo CLI, baixe e instale o `.apk` no Android, autorizando instalação daquela fonte se solicitado. Para listar builds: `npx eas-cli@latest build:list --platform android`. Compartilhe a URL real da página do build no **Expo.dev** e teste o acesso de quem receberá o link (builds internos podem exigir login conforme a configuração da conta). A página oferece o artefato de instalação; QR do ingresso e link de instalador têm finalidades diferentes.

## GitHub e entrega

O código está no repositório Git local informado. Nenhum repositório remoto foi criado ou publicado. Para cumprir o requisito de link GitHub, depois de revisar os arquivos, crie/associe seu repositório na sua conta e publique apenas quando decidir fazê-lo. Não envie `node_modules`, bancos, `.expo`, `dist`, credenciais ou chaves. O `.gitignore` do aplicativo exclui esses arquivos.

Após publicar e concluir o build, registre os links reais nesta lista para a apresentação:

- GitHub: **pendente de publicação autorizada**.
- Página do APK no Expo.dev: **pendente de build bem-sucedido**.

## Limitações conhecidas

- MVP de portaria em um único aparelho, sem autenticação, servidor, sincronização, backup/exportação do banco, edição/exclusão de eventos ou revogação de ingressos.
- QR contém identificadores, sem assinatura digital. A autorização depende da existência e situação do registro no SQLite local; a prevenção de reutilização vale somente nesse banco.
- Os dados não são criptografados no SQLite. Use participantes fictícios na apresentação.
- Consulta nacional da BrasilAPI não inclui feriados municipais/estaduais. API indisponível não impede cadastro.
- Data e hora seguem o fuso do aparelho. Não é um sistema de eventos com múltiplos fusos.
- Histórico carrega registros em memória; listas de ingressos/eventos são virtualizadas, mas o MVP não foi submetido a teste de grande volume.
- Recursos físicos, acessibilidade visual, rotação/tablet e instalação do APK precisam de validação manual no Android. A versão iOS não foi testada.
- A auditoria npm mantém alertas transitivos na cadeia Expo/Metro/Router, detalhados em `TESTES.md`. Correções compatíveis foram tentadas; não houve downgrade ou atualização forçada que quebrasse o SDK.

## Referências oficiais

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [SQLite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Build de APK](https://docs.expo.dev/build-reference/apk/)
