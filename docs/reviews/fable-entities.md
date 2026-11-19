# Revisão independente — entidades allberto (Fable 5.2)

Data: 19/11/2026. Base do diff: `26658be97`. Revisor: Claude Fable 5.2 (modelo solicitado, sem substituição).
Escopo: `src/pages/clients/**`, `src/pages/invoices/**`, `src/pages/recurring-invoices/**`, `src/pages/payments/**`, `src/pages/allberto-entities.css`, `tests/unit/allberto-entities-overview.test.ts`.
Fora do aceite: shell, dashboard, `src/components/**`, tokens e CSS global (ainda em mutação pelo Opus).

## Veredito

**Requer correções.** Há um bloqueio no escopo (achado 1): a visão geral da fatura não mostra os valores persistidos que o handoff e o teste afirmam. O achado 2 é de severidade média e merece correção junto. Os demais são baixos e não bloqueiam.

As quatro listas e o detalhe do cliente estão aprovados no escopo, com as ressalvas baixas abaixo e sem aceite visual (ver Limites).

> **Revalidação em 19/11/2026 (após as correções do Astra): bloqueio resolvido; entidades aprovadas no escopo.** Detalhes por achado em `docs/reviews/fable-integrated.md`, seção "Revalidação das entidades". O texto abaixo é o registro original da primeira revisão.

## Achados

### 1. ALTA (bloqueio) — A visão geral exibe valores recalculados no navegador, não os persistidos

**Onde**
- `src/pages/invoices/overview/Overview.tsx:24` lê `invoice` do contexto do `Outlet`, e usa esse objeto em `:51`, `:95` e `:106-108`.
- `src/pages/invoices/Invoice.tsx:272-275` entrega nesse contexto o átomo editável (`invoiceAtom`), não a resposta da API.
- `src/pages/invoices/Invoice.tsx:161-163` roda `calculateInvoiceSum(invoice)` em toda rota filha, inclusive na visão geral.
- `src/common/helpers/invoices/invoice-sum.ts:120,257-267` e `invoice-item-sum.ts:91` alteram esse mesmo objeto no lugar: `line_total = custo × quantidade − desconto`, `amount = total calculado`, `balance = amount − paid_to_date`.
- `setInvoiceSum` provoca nova renderização de `Invoice` (que assina `invoiceSumAtom` via `useInvoiceUtilities`), então a visão geral repinta com o objeto já alterado.

**Evidência**
Rodei `InvoiceSum.build()` sobre a mesma fixture do teste (total 100, saldo 20, pago 55, item 2 × 40 com `line_total` 72). O objeto passou a ter `amount 80`, `balance 25`, `line_total 80`. O teste `allberto-entities-overview.test.ts:94-107` passa porque simula o contexto com um objeto estático e nunca atravessa `Invoice.tsx`; a garantia que ele declara não existe na aplicação.

**Cenários reproduzíveis**
1. Fatura em rascunho: o servidor guarda saldo 0 até o envio; a visão geral mostra saldo igual ao total.
2. Fatura estornada, ou qualquer fatura cujo saldo persistido não seja `total − pago`: a visão geral mostra a diferença calculada.
3. Cliente em moeda com precisão diferente da empresa: no primeiro cálculo `client` ainda é `undefined` (`Invoice.tsx:111-113`), e o arredondamento usa a moeda da empresa.
4. Alterações não salvas: editar quantidade em `/invoices/:id/edit` e clicar na aba Visão geral mostra itens e totais do rascunho local como se fossem dados da fatura, numa tela que se apresenta como leitura.

**Menor correção completa**
Passar a resposta do servidor no contexto e usá-la na visão geral. `data` não é alterado, porque o efeito de `Invoice.tsx:147` faz `cloneDeep` antes de gravar no átomo.
- `Invoice.tsx`: acrescentar `persistedInvoice: data?.id === id ? data : undefined` ao `context` do `Outlet`.
- `Overview.tsx`: ler `persistedInvoice` para valores, itens, datas e status; devolver `null` quando ausente.
- `Payments` pode continuar com `invoice` (usa só `payments`/`paymentables`, que o cálculo não toca).
- Teste: acrescentar um caso que rode `InvoiceSum.build()` sobre o objeto do átomo e confirme que a visão geral continua mostrando 100 / 20 / 72.

### 2. MÉDIA — Cache de atividade não distingue cliente de fatura

**Onde**
- `src/pages/invoices/edit/components/Activities.tsx:53` e `src/pages/clients/show/pages/HistoryAndActivities.tsx:54` usam a mesma chave `['/api/v1/activities/entity', id]`, ambas com `staleTime: Infinity`.

**Cenário**
Se o backend gerar o mesmo identificador codificado para o cliente nº N e a fatura nº N (o Invoice Ninja usa um único codificador para todos os modelos), abrir o cliente e depois a fatura de mesmo número reaproveita o cache: a visão geral da fatura lista a atividade do cliente, ou o inverso. Numa conta nova, cliente 1 e fatura 1 já colidem.

**O que é fato e o que é suposição**
A chave sem tipo de entidade está confirmada no código. A igualdade dos identificadores entre entidades não foi verificada (sem backend). A colisão já existia nas abas dedicadas; esta entrega a torna rotineira, porque as duas consultas passaram a rodar nas telas de entrada (`Overview.tsx:68` e `clients/show/pages/Invoices.tsx:86-88`).

**Menor correção**
Incluir a entidade na chave nos dois arquivos: `['/api/v1/activities/entity', 'invoice', id]` e `[..., 'client', id]`. A invalidação em `useRefetch.tsx` é por prefixo e continua valendo.

### 3. BAIXA — Botão Editar da visão geral herda os bloqueios do botão Salvar

`Invoice.tsx:221-225`: `disableSaveButton` e `disableSaveButtonOnly` continuam aplicados quando o botão vira Editar. Em fatura cancelada ou bloqueada o botão fica desabilitado, enquanto a aba Editar ao lado abre normalmente.
Correção: aplicar as duas condições apenas quando `!isOverview`.

### 4. BAIXA — Dois caminhos "Editar" levam a editores diferentes

O botão superior respeita a preferência (`Invoice.tsx:218`, `invoicePaths.edit`). A aba Editar aponta sempre para o editor detalhado (`useTabs.tsx:55-56`, já existente). Antes, quem usa o editor guiado ia direto a ele pelo número na lista; agora cai na visão geral e vê as duas opções divergentes.
Não é perda de função. Decisão de produto: ocultar a aba Editar para quem usa o guiado, ou aceitar. Não recomendo trocar o `href` da aba, porque o guiado fica fora do layout com abas.

### 5. BAIXA — Título do navegador e breadcrumb dizem "Editar fatura" na visão geral

`Invoice.tsx:66` (`useTitle('edit_invoice')` define `document.title`) e `:136-137` (breadcrumb com rótulo de edição e link para `/edit`). O título visível já foi tratado em `:205-207`.
Correção: na visão geral, breadcrumb com `href` da própria rota e `setDocumentTitle` com o número da fatura.

### 6. BAIXA — Histórico embutido na aba de faturas do cliente fica espremido e sem estado de erro

`clients/show/pages/Invoices.tsx:86-88` monta `HistoryAndActivities`, que usa `xl:flex-row` com dois cartões `xl:w-1/2`. A partir de 1280 px de viewport, a coluna principal tem cerca de 580 px (por causa da sidebar de 340 px), e cada cartão fica com menos de 290 px contendo busca, alternador e botão de comentário.
Correção só em CSS do escopo: `.allberto-entity-client-history > div { flex-direction: column; }` e `.allberto-entity-client-history > div > * { width: 100%; }`.

Observações do mesmo ponto, sem pedir mudança:
- toda abertura de cliente dispara agora dois POST de leitura a mais (cache compartilhado com a aba dedicada, sem duplicidade);
- o componente não tem estado de erro/retry (comportamento anterior); o handoff só promete isso para o carregamento principal.

### 7. BAIXA — Célula de nome do cliente depende de CSS que só as páginas importam

`useClientColumns.tsx:142-154` emite `.allberto-entity-client-name`, mas o CSS é importado apenas pelas páginas de entidade. O hook também é usado em `src/pages/settings/group-settings/edit/components/Clients.tsx`; se essa tela abrir antes de qualquer página de entidade, nome e identificação saem colados na mesma linha.
Correção: importar `allberto-entities.css` no próprio hook.
Efeito colateral menor: quem tem a coluna `id_number` salva vê o identificador duas vezes.

### 8. BAIXA (acessibilidade) — Estados de carregamento sem nome e rótulo em `dl`

- `role="status"` contendo só o spinner (`Invoice.tsx:302`, `Client.tsx:193`) não anuncia nada. Acrescentar texto `sr-only` com `t('loading')`.
- `aria-label` em `<dl>` (`Standing.tsx:27-30`) tende a ser ignorado por leitores de tela, porque `dl` não tem papel nomeável. Envolver em `<section aria-label>` ou usar título visível.
- O acionador do modal de cartões é um `div` clicável sem teclado (`CardsCustomizationModal.tsx:142-152`). É anterior a esta entrega; registrado porque o arquivo foi tocado.

### 9. Informativo — Resumo de totais sem linhas intermediárias

`Overview.tsx:103-116` mostra total, pago e saldo. Em fatura com imposto ou desconto, a soma dos itens não fecha com o total e a tela não explica a diferença. Há campos persistidos para isso (`total_taxes`, `discount`). Não bloqueia.

## Verificado sem achados

- **Rotas:** o índice `/invoices/:id` fica dentro do mesmo `Guard` (módulo + ver/editar/atribuído); `/edit`, documentos, configurações, atividade, histórico, e-mails, pagamentos, cronograma, PDF, e-mail e guiado estão intactos (`routes.tsx:158-216`).
- **Abas:** aba ativa por igualdade exata de caminho, então Visão geral não fica marcada nas outras rotas; a navegação anterior/próximo cai em `/invoices/:id/` e é normalizada.
- **Permissões:** ResourceActions segue condicionado a editar/atribuído; usuário só com visualização vê a visão geral sem botão de edição; links de cliente usam `disableNavigation`.
- **Ctrl+S:** desativado na visão geral, continua interceptando o atalho do navegador; inalterado no editor. `AddUninvoicedItemsButton` só aparece fora da visão geral.
- **Listas:** o diff das quatro páginas é só o invólucro `<section>` e a importação do CSS. Endpoint, paginação, filtros, ações em lote, guards, Verifactu, sliders e preferências salvas são idênticos à base. Todas as colunas dos novos padrões existem (`entity_state` e `contact_email` conferidas).
- **Cartões do cliente:** layout salvo é respeitado, inclusive lista vazia; `gateways` no padrão só aparece com tokens e com a regra de exibição existente.
- **Moeda:** fatura e cliente formatam com país e moeda do próprio cliente; valor ausente vira `—`, não zero.
- **Conteúdo rico:** notas dos itens passam por `sanitizeHTML` (DOMPurify, perfil HTML) antes de `dangerouslySetInnerHTML`.
- **Hooks:** ordem estável em `Overview`, `Invoice` e `Client`; nenhum hook após retorno condicional.
- **Traduções:** todas as chaves novas já são usadas em outras telas do produto; nenhuma string fixa nem dado fictício em produção.
- **Tokens:** todos os `--ab-*` consumidos existem em `src/resources/css/allberto.css`.
- **Licença:** cabeçalhos de copyright preservados nos arquivos alterados e no novo `Overview.tsx`.

## Diferenças em relação à proposta

Aceitáveis por falta de contrato de dados (concordo com o handoff, itens 1 a 5): KPIs e abas de status nas listas, mensalidade/próxima cobrança/cartão em Clientes, tentativas e código de recusa na fatura, botões "Cobrar de novo" e "Avisar cliente" no topo (as ações reais seguem em ResourceActions/CommonActions).

Pendentes de integração compartilhada, não bloqueiam este escopo:
- recomposição das linhas em duas colunas no celular e abas de status: dependem do `DataTable` do Opus;
- ocultar valores: as telas de entidade não declaram `usePrivacySupport`, então o controle da shell não aparece nelas. É coerente, mas a máscara nessas telas ainda não existe;
- selo de status e botões: dependem de `Badge`/`Button` finais.

## Testes executados

- `npx vitest run tests/unit/allberto-entities-overview.test.ts`: **5/5 passaram**.
- Demonstração do achado 1: teste temporário fora do repositório, chamando `InvoiceSum.build()` com a fixture do teste; resultado `{"amount":80,"balance":25,"line_total":80}`. Nenhum arquivo do repositório foi criado ou alterado além deste relatório.

## Limites

- Sem navegador, sem backend e sem dados reais: nenhuma tela foi renderizada. Responsividade (1440/1180/860/390), tema escuro, foco e contraste foram avaliados só por leitura de código e CSS.
- Não é auditoria WCAG; o achado 8 cobre apenas estrutura.
- Não rodei suíte completa, `tsc`, build, lint nem E2E.
- A premissa de identificadores iguais entre entidades (achado 2) depende do backend e não foi verificada.
- Shell, dashboard e componentes compartilhados não receberam aceite; o `DataTable` tinha alterações em andamento durante a revisão.
