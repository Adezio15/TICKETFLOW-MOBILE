# Verificações e pendências — TicketFlow

Registro da implementação em 16/10/2026. Ambiente Windows, Node.js 26.1.0 e Expo SDK 57. Nenhum APK foi gerado e nenhum teste físico está sendo declarado como realizado.

## Verificações executadas

| Comando                                                                | Resultado observado                                                                                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `npm test`                                                             | **21 testes aprovados, 0 falhas**                                                                                   |
| `npm run typecheck`                                                    | Aprovado, sem erros TypeScript, incluindo testes e adaptador nativo                                                 |
| `npm run lint`                                                         | Aprovado, sem erros ou avisos                                                                                       |
| `npx expo install --check`                                             | Dependencies are up to date                                                                                         |
| `npx expo-doctor`                                                      | **21/21 verificações aprovadas**                                                                                    |
| `npm run test:api`                                                     | Chamada real bem-sucedida à BrasilAPI de 2026, 14 feriados; Natal em 25/12/2026, tipo national                      |
| `npx expo export --platform android --output-dir dist --max-workers 2` | Bundle Android/Hermes exportado com sucesso; **não equivale a APK ou teste em dispositivo**                         |
| `npm audit fix`                                                        | Correções compatíveis aplicadas, mas processo terminou com código 1: restam **30 alertas (12 moderados, 18 altos)** |

As primeiras rodadas identificaram tipagem Node ausente, regras de hooks, patch do Expo desatualizado, expo-font duplicado e configuração antiga de splash. Esses problemas foram corrigidos e as verificações acima foram executadas novamente.

## O que os testes verificam

`test/business.test.ts` utiliza `node:sqlite` com o mesmo schema SQL, o mesmo Repository e os mesmos Controllers do aplicativo. O adaptador de teste executa SQL real; não é uma coleção em memória fingindo ser SQLite. O teste de reabertura utiliza banco em arquivo temporário exclusivo, removido ao terminar.

1. Criação de evento válido com campos persistidos.
2. Rejeição de campos obrigatórios, capacidade, data e coordenadas inválidos.
3. Emissão com UUIDs distintos, participante normalizado e payload QR correto.
4. Limite de capacidade, inclusive solicitações simultâneas pelo controller.
5. Limite protegido também por trigger SQL.
6. Validação por QR e registro de horário e tabela validacoes.
7. Bloqueio da segunda utilização pelo QR/código manual.
8. Duas validações simultâneas aprovam apenas uma entrada.
9. Rejeição de inexistente, QR malformado, evento divergente e portaria incorreta.
10. Rollback da utilização se o registro da validação falhar; nova tentativa pode funcionar.
11. Histórico com filtros por evento e situação.
12. Persistência ao fechar e reabrir SQLite em arquivo, incluindo bloqueio de reutilização.
13. Dados demonstrativos inseridos somente no banco vazio.
14. Rejeição de emissão para evento inexistente e participante inválido.
15. Data/hora local rejeita dias e horários inexistentes.

`test/holidays.test.ts` possui seis testes com fetch controlado: endpoint e resposta, erro HTTP, erro de conexão, contrato/JSON inválidos, ano fora do intervalo e timeout de 10 segundos. Eles não são prova de disponibilidade da BrasilAPI. A evidência real de integração é o comando `npm run test:api`, executado separadamente.

O adaptador nativo `expoDatabase.ts` abre conexões próprias, habilita chaves estrangeiras antes de BEGIN IMMEDIATE e confirma/desfaz transações. Seu funcionamento no runtime Android ainda precisa de teste físico; o teste Node comprova as regras e consultas, e a exportação comprova o empacotamento JavaScript.

## Alertas reais de dependências

A auditoria aponta dependências transitivas `braces`/`micromatch` na cadeia Metro, `node-forge` no ferramental Expo, `decode-uri-component`/`query-string` no Router e `uuid`/`xcode` no ferramental de configuração. São 30 nós afetados no relatório npm, não 30 falhas independentes no código do aplicativo.

`npm audit fix` foi executado sem `--force`. A resolução automática restante propõe mudanças incompatíveis, incluindo downgrade do Expo para 44 ou Router 58; elas não foram aplicadas. A compatibilidade com o SDK 57 passou no Expo Doctor. Isso **não significa auditoria de segurança aprovada**. Antes de uso em produção, reavaliar os avisos e atualizações oficiais do SDK/dependências, sem atualizar pacotes nativos aleatoriamente.

## Checklist pendente em Android

Use esta lista para registrar testes reais. Os itens continuam pendentes até alguém executá-los em dispositivo/emulador.

- [ ] Instalar/abrir app num Android; verificar todas as abas, telas da pilha, voltar e estados vazios.
- [ ] Criar evento futuro, rejeitar campos inválidos e conferir data/horário no fuso do aparelho.
- [ ] Conferir aviso real de feriado e consultar sem internet; cadastro deve continuar disponível.
- [ ] Emitir até a capacidade; verificar bloqueio de emissão adicional no runtime expo-sqlite.
- [ ] Compartilhar PNG do QR, ler no aparelho emissor e conferir dados do participante/evento.
- [ ] Validar manualmente pelo UUID completo e recusar segunda utilização e código inexistente.
- [ ] Conferir rejeição do QR de outro evento quando a portaria estiver selecionada.
- [ ] Confirmar feedback verde/vermelho, vibração habilitada/desabilitada e ausência de dupla leitura da câmera.
- [ ] Negar/conceder câmera, localização e notificações; testar ajustes do sistema.
- [ ] Capturar GPS e salvar coordenadas; continuar sem GPS quando negado/desativado.
- [ ] Receber notificação local ao emitir/validar, após salvar preferência e conceder permissão.
- [ ] Conferir marca, modelo, SO e versão e abrir documentação no navegador.
- [ ] Fechar/reabrir app; conferir eventos, ingressos, utilização e preferências persistidas.
- [ ] Verificar filtros de histórico, atualização do dashboard, teclado, legibilidade e áreas seguras.
- [ ] Concluir build EAS preview, instalar o APK e repetir o fluxo principal fora do Expo Go.
- [ ] Publicar no GitHub somente quando autorizado e registrar link real.
- [ ] Registrar e testar o link real do instalador no Expo.dev depois de build concluído.

Não havia ferramenta adb disponível no PATH verificado. Nenhum emulador ou aparelho foi utilizado. Não foram executados build EAS, publicação, push, teste de interface automatizado, teste de carga ou validação iOS.
