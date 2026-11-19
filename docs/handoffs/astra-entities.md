# Handoff Astra — entidades allberto

## Entrega

Adaptação sobre o frontend real do Invoice Ninja, sem aplicação paralela, dependência nova, fixture em produção ou operação externa. Escopo de escrita respeitado: quatro famílias de páginas, `src/pages/allberto-entities.css`, teste focado e este documento. Shared components, shell, fontes e tokens continuam sob responsabilidade do Opus.

### Listas

Clientes, Faturas, Faturas recorrentes e Pagamentos envolvem o DataTable existente em `.allberto-entity-list` e uma classe de família. O CSS adapta superfície, borda/raio, densidade e tipografia; implementação de toolbar/abas responsivas/seleção compartilhada continua no DataTable do Opus.

Defaults foram reordenados para seguir a hierarquia do design; preferências de colunas já salvas continuam prevalecendo e todas as colunas continuam disponíveis no seletor:

- Clientes: nome (com identificação em segunda linha), saldo, pago até hoje, contato, estado.
- Faturas: número, cliente, emissão, vencimento, valor, saldo, status.
- Recorrentes: cliente, número, valor, frequência, próximo envio, prazo de vencimento, auto-bill, ciclos restantes, status.
- Pagamentos: data, número, cliente, fatura, meio, valor, status, referência da transação.

Nenhum endpoint, paginação, filtro persistido, tag, ordenação, seleção, bulk action, modal, exportação/importação, gate de permissão, regra Verifactu ou slider foi substituído. A mudança de defaults vale também para tabelas relacionadas que reutilizam os mesmos hooks.

### Cliente

`Client.tsx` mantém ResourceActions, PreviousNextNavigation, CardsCustomizationModal, tabs e Outlet real. A composição agora tem identificação/status, quatro cartões de saldos persistidos, conteúdo/tabulação à esquerda e cartões configurados à direita (340 px; uma coluna até 1180 px). As quatro medidas são **pago até hoje, saldo pendente, crédito e pagamento não aplicado**, não mensalidade/MRR/atraso inventados.

`Standing.tsx` usa campos do cliente e a mesma função `useFormatMoney`, com `—` quando um campo numérico não está disponível. Não agrega clientes/moedas e não calcula dívida.

Os cartões de gateway entraram no default compartilhado com o modal de customização, mas só aparecem quando há tokens e `useShouldDisplayClientGatewaysAndAutoBill` permite. Preferências já salvas continuam preservadas. Sem uma preferência salva, os saldos aparecem no topo como na proposta. Quando existe layout salvo de cards, todos eles — inclusive “standing” — são apresentados na sidebar na ordem escolhida, preservando mostrar/ocultar e reordenação no modal. Os demais cards mantêm conteúdo e ações.

A aba padrão de faturas incorpora `HistoryAndActivities` existente abaixo da lista, conservando também a aba dedicada. Isso reutiliza os dois endpoints de leitura já existentes de atividades/emailHistory e o mesmo cache; não envia mensagens. Loading/erro/retry do carregamento principal agora são explícitos.

### Fatura

Nova rota **index `/invoices/:id`** dentro do Guard existente, renderizando `overview/Overview.tsx`. A aba Visão geral foi adicionada sem remover `/edit`, documentos, settings, histórico, atividade, pagamentos, cronograma, email/PDF ou guided editor. O número da fatura nas listas abre a visão geral; a ação Editar e o botão superior continuam usando `useInvoiceEditorPaths`, respeitando o editor preferido.

Composição: valor/status/meta + PDF; atividade, itens e pagamentos à esquerda; dados de fatura/cliente/recorrente/emailHistory na sidebar. Itens usam `line_total` persistido; total/pago/saldo usam `amount`, `paid_to_date`, `balance`; **não** se deduz pago como total menos saldo. Rich notes passam pelo sanitizer existente. O formatter recebe país/moeda do cliente de cada fatura.

O botão superior vira Editar nessa visão. Ctrl+S e AddUninvoicedItemsButton permanecem no editor, sem salvar uma visão geral somente de leitura. ResourceActions e CommonActions continuam sendo os mecanismos reais de cobrança/email; não há novo handler financeiro. Activities e Payments são componentes existentes, com estado de erro/retry adicionado à atividade e vazio explícito de pagamentos.

## Contratos com Opus

- Tokens consumidos: `--ab-surface`, `--ab-bg`, `--ab-side`, `--ab-ink`, `--ab-muted`, `--ab-line`, `--ab-accent`, `--ab-danger` (fallbacks do design). Não alterei os tokens, `useColorScheme` nem props públicas de Default, DataTable, Card, Badge ou botões.
- DataTable precisa continuar responsável por filtros reais. Pedido encaminhado: se houver abas de status visuais, ligar aos mesmos `customFilter/setCustomFilterIfChanged` internos, sem contagens inventadas e preservando multiselect/arquivados/deletados e preferências.
- Listas relacionadas do cliente também estão dentro de `.allberto-entity-list`; o estilo global pode usar esse escopo. O CSS próprio não converte a tabela em `div` e não oculta colunas customizadas.
- Se a shell implementar máscara de valores, incluir valores de `.allberto-entity-overview-amount > strong`, `.allberto-entity-metric dd`, `.allberto-entity-summary dd` e `.allberto-entity-items td:last-child`, com proteção de nomes acessíveis/tooltips. Um CSS de blur sozinho não é garantia de privacidade.
- DataTable/Badge/mobile actions permanecem dependência visual da entrega Opus. O CSS aqui não pretende substituí-los.

## Verificações

- `npx vitest run tests/unit/allberto-entities-overview.test.ts`: **5/5 passaram**.
- Testes SSR isolam shared controls e rede. Cobrem persistência dos valores (incluindo pago diferente de total−saldo e line_total diferente de custo×quantidade), moeda correta, chamada ao sanitizer, ausência de valores/contrato, estado sem fatura e quatro saldos distintos do cliente.
- Formatter Biome aplicado somente aos arquivos desta entrega. `git diff --check` executado no escopo.
- Não executei npm ci, suíte completa, TypeScript completo ou build em paralelo ao coordenador. São necessários no conjunto final.
- Não executei E2E upstream (resetam contas), acessei WHMCS/VPS/endpoints financeiros nem enviei emails. Não houve navegação autenticada do app porque não foi fornecida sessão/fixture de homologação autorizada. A inspeção Orca anterior validou a referência, não o frontend implementado.
- Antes do aceite visual: capturar dados autorizados/fixtures de homologação nas quatro listas, detalhe cliente e `/invoices/:id`, claro/escuro, 1440/1180/860/390; conferir customização de colunas/cards, filtros, seleção, ações busy/erro e teclado. Não afirmar paridade de pixels ou integração ponta a ponta a partir dos testes SSR.

## Gaps de dados e diferenças deliberadas

1. Listas não ganharam KPIs globais calculados sobre a página atual. O DataTable carrega páginas; não há contrato confirmado de agregados globais para reproduzir os três KPIs das pranchas. Contagem/paginação existentes continuam reais.
2. Clientes não possuem MRR/mensalidade/estado de atraso equivalente à proposta no contrato de lista; exibimos saldos e estado de entidade reais. Não chamar saldo aberto de atraso.
3. Recorrentes mantêm frequência, ciclos e auto-bill reais. Não presumir que todas sejam mensais ou que envio seja cobrança/vencimento. Não renomear amount para mensalidade.
4. Pagamentos mantêm semântica real de status e alocações; não inserimos tentativas recusadas como pagamentos. A relação invoice.payments/paymentables não equivale ao log de tentativas do gateway.
5. A fatura não mostra código de recusa, tentativas futuras ou cartão arbitrário do cliente como se fossem dados da cobrança. O detalhe usa a atividade real e as alocações de pagamentos existentes. A seção de tentativas da referência exige contrato de gateway comprovado.
6. Layout de cards personalizado prevalece sobre a posição padrão dos saldos; nesse caso os saldos aparecem na sidebar na ordem salva, evitando descartar preferências existentes.
7. A interface usa as traduções existentes do produto. Não inseri strings novas de produto em português fora do sistema i18n.

## Arquivos

Existentes modificados:

- `src/pages/clients/index/Clients.tsx`
- `src/pages/clients/common/hooks/useClientColumns.tsx`
- `src/pages/clients/show/Client.tsx`
- `src/pages/clients/show/components/Standing.tsx`
- `src/pages/clients/show/components/CardsCustomizationModal.tsx`
- `src/pages/clients/show/pages/Invoices.tsx`
- `src/pages/invoices/index/Invoices.tsx`
- `src/pages/invoices/Invoice.tsx`
- `src/pages/invoices/routes.tsx`
- `src/pages/invoices/common/hooks/useInvoiceColumns.tsx`
- `src/pages/invoices/common/hooks/useTabs.tsx`
- `src/pages/invoices/edit/components/Activities.tsx`
- `src/pages/invoices/edit/components/Payments.tsx`
- `src/pages/payments/index/Payments.tsx`
- `src/pages/payments/common/hooks/usePaymentColumns.tsx`
- `src/pages/recurring-invoices/index/RecurringInvoices.tsx`
- `src/pages/recurring-invoices/common/hooks.tsx`

Novos: `src/pages/allberto-entities.css`, `src/pages/invoices/overview/Overview.tsx`, `tests/unit/allberto-entities-overview.test.ts`, `docs/handoffs/astra-entities.md`.

Sem commit, push ou deploy por este agente.

## Resposta à revisão Fable — 19/11/2026

1. **Corrigido (alta):** `Invoice` passa `persistedInvoice: data?.id === id ? data : undefined` no Outlet, tipado em `edit/Edit.tsx`. Overview usa exclusivamente esse snapshot para itens, valores, status e datas. O átomo continua disponível aos editores existentes. Regressão nova executa o `InvoiceSum.build()` real no clone editável: confirma mutação 100→80, saldo 20→25, linha 72→80; Overview continua 100/20/72 e não mostra número/data/item não salvos. **Teste observado falhando antes da correção**, com HTML `currency-a:80` e `UNSAVED-DRAFT`; passou depois. Guard também testado com draft presente e snapshot ausente.
2. **Corrigido (média):** cache de atividade contém tipo de entidade. Busca de todos os callers/invalidation com `rg` identificou Activities, InvoiceSlider, EInvoice e Verifactu em invoices, HistoryAndActivities em clients, Activities + RecurringInvoiceSlider em recurring, Activities em payments. Todos os queries desse escopo receberam tipo. Invalidations por prefixo `/api/v1/activities/entity` em `useRefetch` e EInvoice/Verifactu continuam abrangendo as chaves. Quotes/credits/purchase-orders/vendors ainda usam chave antiga entre si, fora deste escopo; não colidem com nossas novas chaves tipadas.
3. **Corrigido:** bloqueios de Salvar (cancelada/busy/locked) aplicados apenas fora do overview; acesso ao editor conserva guard original.
4. **Decisão preservada:** aba Editar abre editor detalhado; ação superior Editar respeita preferência pelo editor guiado. Ambos existentes; não redirecionar aba para um layout externo. Diferença documentada para decisão posterior de rótulo.
5. **Corrigido:** título do navegador usa número da fatura no overview e retorna a Edit invoice nas demais rotas. Breadcrumb aponta para overview quando nessa rota.
6. **Corrigido:** histórico embutido usa cartões empilhados em toda largura disponível. Adicionados erro/retry independentes para atividade e histórico de email, sem mascarar falha como vazio.
7. **Corrigido:** hook useClientColumns importa CSS, incluindo consumidor em group-settings. Duplicação visual de id_number quando usuário o mantém como coluna continua possível e respeita sua preferência.
8. **Corrigido:** loaders da entidade/atividade/histórico têm texto sr-only; Standing envolve dl em section nomeada; acionador do modal de cartões é botão nativo com nome acessível.
9. **Corrigido:** totais exibem `total_taxes` e `discount` persistidos quando não zero; desconto é moeda ou porcentagem segundo `is_amount_discount`, sem derivar subtotal nem recalcular impostos. Novo teste cobre ambas as representações.

Validação após correções: `npx vitest run tests/unit/allberto-entities-overview.test.ts` **7/7**, `git diff --check` no escopo sem erros. Full tsc/build permanecem com coordenador. QA browser isolado em andamento; não representa validação de backend.

Arquivos adicionais à lista anterior: `src/pages/invoices/edit/Edit.tsx`, `src/pages/clients/show/pages/HistoryAndActivities.tsx`, `src/pages/invoices/common/components/InvoiceSlider.tsx`, `src/pages/invoices/edit/components/EInvoice.tsx`, `src/pages/invoices/edit/components/Verifactu.tsx`, `src/pages/recurring-invoices/edit/components/Activities.tsx`, `src/pages/recurring-invoices/common/components/RecurringInvoiceSlider.tsx`, `src/pages/payments/edit/components/Activities.tsx`.


## Acabamentos após QA local

A atividade da fatura com resposta 200 vazia usa `no_records_found`, em Overview e aba Activity; falhas de rede continuam mostrando erro/retry. O suplemento de validação local cobre as duas rotas. Acabamentos compartilhados (cabeçalho Ações mobile, foco drawer/modal, Tabs controlado e opções inválidas de SelectField) e resultados de navegador estão em `docs/handoffs/astra-local-validation.md`. Nenhuma lógica de persistência/financeira adicional foi alterada.
