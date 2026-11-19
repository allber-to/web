# 002 — Backend local e integração real

**Estado:** concluída e aceita pelo CTO Fable 5.2, com ressalvas documentadas.
**Coordenação:** SINAPSE. **CTO e aceite técnico:** Fable 5.2. **Implementação:** Astra.
**Autorização:** o proprietário pediu continuar com backend local, Fable como CTO e Astra implementando. VPS/produção continuam em etapa posterior.

## Objetivo

Executar uma instância real e descartável do Invoice Ninja no computador local, conectar o frontend Allberto e demonstrar autenticação, persistência e fluxos principais com dados de teste. Preservar a prévia isolada existente como teste visual, sem confundi-la com integração real.

## Estado inicial

- Frontend em `a56ec90f0`, PR #1 em rascunho, checkout limpo antes desta fase.
- 343 testes unitários, 13 casos de navegador isolado, lint, build e CI aprovados na fase anterior.
- Mac arm64; Docker CLI e Compose 5.1.4 instalados. Contexto `desktop-linux` aponta a socket local; daemon inicialmente parado. Docker Desktop iniciado em segundo plano pelo coordenador para preparar esta fase.
- PHP local 8.5.7, sem Composer encontrado no PATH; preferir ambiente isolado a alterar o PHP global.
- Aproximadamente 46 GiB livres no volume da worktree na auditoria inicial.
- Fork backend localizado na conta do projeto: `https://github.com/allber-to/invoiceninja`, branch padrão `v5-stable`, fork de `invoiceninja/invoiceninja`. O CTO conferirá diferenças e compatibilidade antes de escolher fonte/imagem.
- Docker Desktop iniciou com sucesso: Engine 29.4.3, Linux aarch64; nenhum container em execução na checagem inicial. Não há instância de backend nem dados reais fornecidos.

## Plano e handoffs

1. **Fable/CTO:** definir versão compatível, topologia local, isolamento, configuração frontend/API, criação de dados e critérios de aceite. Entrega: `docs/architecture-local-backend.md`, com fontes e decisão executável.
2. **Astra:** inventário somente leitura em paralelo; após a decisão do CTO, implementar o menor ambiente reproduzível e conectar o frontend real. Entrega: arquivos de ambiente local, comandos de start/stop, documentação e evidências de integração.
3. **Fable/CTO:** revisar implementação, configuração, exposição de serviços, persistência e resultados dos fluxos. Corrigir achados com Astra antes do aceite.
4. **Coordenação:** consolidar checks, instruções e evidências no GitHub. Sem merge/deploy de produção.

## Progresso

- [x] Confirmar autorização e divisão CTO/implementação.
- [x] Auditar checkout e ferramentas locais.
- [x] Receber e validar arquitetura Fable.
- [x] Subir backend e banco isolados com versão identificada.
- [x] Conectar frontend real e autenticar como administrador; ACL restrita fora desta fase.
- [x] Criar dados descartáveis e verificar persistência após recarga e reinício.
- [x] Validar clientes, faturas, recorrentes, pagamentos manuais e indicadores do painel.
- [x] Validar PDF e comunicação em log local, com ressalva de histórico de provedor vazio.
- [x] Revisão CTO, checks finais e documentação atualizada.

## Restrições operacionais

Usar somente o Docker local; serviços acessíveis apenas por loopback, volumes/rede próprios do projeto e credenciais locais fora do Git. Não alterar/parar outros projetos nem usar prune/reset global. Nenhum gateway real ou envio de e-mail para terceiros; usar transporte local/log. Não executar a suíte upstream que reseta contas sem conferir que aponta exclusivamente para a instância descartável criada aqui. Não acessar WHMCS, VPS, DNS ou produção nesta etapa.

## Arquivos desta fase

- `docs/stories/002-local-backend.md` — plano e registro inicial.
- `docs/architecture-local-backend.md` — decisão GO do Fable, versão, topologia e critérios A1–A10.
- `docs/handoffs/astra-backend-inventory.md` — contratos do frontend e riscos dos testes upstream.
- `local-backend/` — Compose, configuração, bootstrap e smokes API/navegador.
- `src/pages/dashboard/components/allberto/Sections.tsx` e `tests/unit/allberto-upcoming-charges.test.ts` — correção/regressão do calendário.
- `docs/handoffs/astra-backend-local.md` — resultados A1–A10, evidências e operação.
- `docs/evidence/backend-local/` — captura real inspecionada e resultados resumidos.

Coordenador confirmou 345 testes/48 arquivos, lint e build aprovados após a correção. Navegador real: 150 respostas, zero erros e exit 0 natural; escrita de cliente pela UI e persistência após reinício comprovadas. [Fable aceitou A1–A10](../reviews/fable-local-backend.md), sem bloqueios nem correções obrigatórias.

## Decisão e execução

Fable verificou que o fork backend `allber-to/invoiceninja@15ea35ea63f367eba33c04b7acd9ab1227853537` corresponde à release 5.13.49 sem arquivos alterados. A imagem oficial foi fixada pelo digest documentado na arquitetura; evita um build adicional que produziria o mesmo código. A implementação foi liberada ao Astra após essa conferência.

O ambiente usa o contexto Docker local `desktop-linux`, projeto Compose `allberto-ninja-local`, backend publicado somente em `127.0.0.1:8012` e frontend real em `127.0.0.1:3100`. App, banco e Redis ficam em rede interna, sem saída; e-mails usam log. Credenciais geradas não entram no Git. A prévia visual em 4178 permanece separada.

Os critérios reais incluem autenticação, três clientes, faturas em estados distintos, recorrente ativa, pagamento parcial, indicadores por moeda, PDF, e-mail em log e persistência após reinício. Não executar a suíte E2E upstream: seus resets por spec continuam ativos mesmo sem o global setup. O CTO conferiu a implementação, as evidências e o runtime em leitura antes do aceite.

### Achados da integração

- API 5.13.49 respondeu aos fluxos de autenticação e CRUD. Os dados de teste conferiram MRR de R$ 75,00, a receber de R$ 300,00, vencido de R$ 200,00, recebido de R$ 23,45 e saldo de R$ 100,00 na fatura parcialmente paga. PDF gerado mantendo a rede interna.
- A mensagem de teste foi gravada no log local, mas `emails/clientHistory` retornou vazio. Astra identificou que esse histórico depende de eventos de `SystemLog`; o transporte local registra `sent_date`/`message_id` na invitation. Fable confirmou o comportamento correto de transporte log e aceitou A7 com essa ressalva, sem alegar entrega externa.
- A API retorna `next_send_date` com horário (`YYYY-MM-DD HH:mm:ss`). A lista de próximas cobranças já interpreta essa data, mas o contador por dia comparava a string inteira a `YYYY-MM-DD` e mostrava zero. Autorizada correção mínima com o `dayjs` existente e regressão do componente usando o formato real.

Limites aceitos: administrador apenas, sem gateway ou entrega externa de e-mail. Os dados de teste são datados e a recorrente pode gerar nova fatura; parar o Compose quando ocioso. O smoke usa UTC e pode deslocar a data após 21h BRT. A implantação na VPS segue como etapa posterior.
