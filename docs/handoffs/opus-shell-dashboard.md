# Handoff Opus — shell, componentes compartilhados e Painel

Data: 19/11/2026. Base: fork `allber-to/web` (frontend React do Invoice Ninja), sem commits, push, deploy, dependências novas, WHMCS, VPS ou serviços financeiros. **Toda validação foi local** (testes unitários e fixture de navegador com rede interceptada). Não existe backend de homologação: nada aqui prova integração ponta a ponta com um servidor Invoice Ninja real.

## 1. Inventário de contratos (lido antes de alterar)

| Contrato | Onde | Como foi preservado |
| --- | --- | --- |
| `useColorScheme()` → chaves `$0…$25` | `src/common/colors.ts` | Mesmas chaves e tipos; só os valores passaram à paleta da proposta (espelham os tokens `--ab-*`). |
| Props de `Default` | `src/components/layouts/Default.tsx` (≈100 páginas) | Todas mantidas. Adicionadas opcionais `withoutPageTitle` e `contentVariant`. Unlock Pro/White label (gate de licença), salvar/cancelar/`additionalSaveOptions`, `saveBtnAtom`, `navigationTopRight`, `topRight`, breadcrumbs, `aboveMainContainer`, banners, socket "invoice viewed", Feedback: preservados. Ordem de hooks do unlock coberta pelo teste upstream. |
| `useNavigation()` | `layouts/common/navigation.ts` (não editado) | Permissões, módulos habilitados, `rightButton`, `subOptions` e evento `navigation.changeVisibility` intactos. A reordenação é feita por `organizeNavigation` sobre o resultado. |
| `NavigationItem`, `DesktopSidebar`, `MobileSidebar`, `SidebarItem` | `layouts/components/*` | Mesmos nomes/exports/props. Cores personalizadas do usuário (`useThemeColorScheme`) continuam aplicadas. Sidebar mini (`show_mini_sidebar`) preservada. Links respeitam a proteção de alterações não salvas (`preventLeavingPageAtom`). |
| `CompanySwitcher`, `QuickCreatePopover`, `Search`, `Notifications`, `HelpSidebarIcons` | componentes reais | Reutilizados na topbar/gaveta. Novas props opcionais (`variant`). Troca de empresa, adicionar empresa, account management, logout, atalho de busca, modal de busca, criação rápida, notificações, About/licença/versão, suporte, colapsar menu: preservados. |
| `Button`, `Card`, `Badge`, `DataTable` | `components/**` | Props inalteradas; apenas classes visuais. `DataTable` ganhou opcional `withStatusTabs` (ver §3). |
| Painel atual | `pages/dashboard/**` | `Totals` (moeda, dia/semana/mês, período, período personalizado, rascunhos, cartões configuráveis, preferências), `Chart`, `Activity`, `RecentPayments`, `UpcomingInvoices`, `PastDueInvoices`, `UpcomingRecurringInvoices`, `ExpiredQuotes`, `UpcomingQuotes` continuam no Painel. |

### Endpoints usados pelo novo Painel (todos já existentes no backend upstream; nenhum inventado)

Confirmados lendo `invoiceninja/invoiceninja` (`routes/api.php`, `ChartService.php`, `ChartQueries.php`, `AnalyticsQueries.php`):

| Dado | Endpoint | Semântica no backend |
| --- | --- | --- |
| Receita recorrente mensal | `POST /api/v1/charts/analytics_totals` → `[moeda].mrr.mrr` | Soma de `recurring_invoices.amount` com `status_id = 2` (ativas), normalizada por frequência, por moeda do cliente; `999` = consolidado convertido pelo backend. |
| A receber / Em atraso / nº faturas | mesmo endpoint → `[moeda].aging` | Saldo de faturas enviadas/parciais com `balance > 0`. Em atraso = `total − current_amount` (vencimento < hoje). **Não depende do período do histórico.** |
| Recebido no mês | `POST /api/v1/charts/totals_v2` com o mês corrente fixo → `revenue.paid_to_date` | `amount − refunded` de pagamentos com status 1,4,5,6 (inclui pendente) e data no mês. |
| Precisa de ação | `GET /api/v1/invoices?overdue=true&…&per_page=50&sort=due_date|asc` | Mesma consulta do card original (até 50, mais antigas primeiro). |
| Próximas cobranças | `GET /api/v1/recurring_invoices?client_status=active&…&sort=next_send_date_client|asc` | Mesma consulta do card original; janela de 7 dias aplicada no cliente, com aviso se a página pode estar truncada. |
| Maiores contratos | `GET /api/v1/recurring_invoices?client_status=active&…&per_page=5&sort=amount|desc` | Ordenação genérica por coluna `amount`. |

**Risco de compatibilidade:** `charts/analytics_totals` existe no upstream atual, mas o frontend do fork não o usava. Se o servidor Allberto rodar versão sem a rota (404/405), os três KPIs mostram “Indicador indisponível nesta versão do servidor.” — sem nova tentativa automática e nunca zero; 403 mostra “Sem permissão…”. Validar contra o servidor real quando houver homologação.

## 2. Decisões

- **Shell única**: uma topbar renderizada uma vez; o layout ≤ 860 px é CSS. Evita duplicar a busca (atalho ⌘K/modal) e notificações.
- **Tokens**: `src/resources/css/allberto.css` (importado no topo de `app.css`) define `--ab-surface, --ab-bg, --ab-side, --ab-ink, --ab-muted, --ab-line, --ab-accent, --ab-danger, --ab-ok, --ab-warn` (contrato com Astra) + auxiliares (`--ab-label`, `--ab-focus`, `--ab-topbar`…). Tema escuro em `:root[data-ab-theme='dark']`, definido pela shell a partir da preferência real `dark_mode`.
- **Contraste**: `--ab-label` claro passou de `#8b8b94` (~3,4:1) para `#6b6b74` (~5,3:1) e `$17` idem. Valor calculado, sem auditoria WCAG formal.
- **Menu**: principal = Painel, Clientes, Faturas recorrentes, Faturas, Pagamentos, Orçamentos, Produtos, Relatórios, Configurações. “Mais” (recolhível, `aria-expanded`, abre sozinho se a rota atual estiver nele) = Créditos, Projetos, Tarefas, Fornecedores, Ordens de compra, Despesas, Despesas recorrentes, Transações, DocuNinja e **qualquer módulo desconhecido** (para nunca sumir).
- **Página**: título/breadcrumbs/ações (salvar, cancelar, `topRight`, `navigationTopRight`) vão para uma barra no topo da folha (`h1`). O Painel desenha seu próprio cabeçalho (`withoutPageTitle`).
- **Ações do Painel**: só navegação para fluxos reais protegidos — abrir fatura/cliente/recorrente e “Avisar cliente” → `/invoices/:id/email` (tela real com pré-visualização e envio explícito; exige `edit_invoice`). Nenhum envio/cobrança disparado do Painel, nenhum sucesso simulado ou “desfazer”.
- **Ocultar valores** (`layouts/common/privacy.ts`): estado real (`jotai` + `localStorage`). O botão só aparece quando a tela declara suporte (`usePrivacySupport()`); a máscara só vale enquanto essa tela está montada. No Painel cobre KPIs, listas, cartões existentes (via `useDashboardFormatMoney`), totais do período, `payment_amount` das atividades, `aria-label`/`title`; a barra de proporção e o gráfico são removidos (proporções revelariam valores). É privacidade visual, não controle de acesso.
- **Erro ≠ zero**: KPIs, listas e o cartão “Transações recentes” só exibem números após sucesso; erro mostra “indisponível” + “Tentar de novo” (refetch real). Corrigido comportamento upstream em que erro de `totals_v2` exibia `R$ 0,00`.
- **Strings novas**: chaves `allberto_*` em `src/resources/lang/pt_BR/pt_BR.json` e `en/en.json` (ver §8). Sem `defaultValue` no código.
- **Fontes**: Geist (variável) e Albert Sans 700, subconjuntos latin/latin-ext extraídos byte a byte da proposta para `public/allberto/fonts/`, com `OFL.txt` (texto integral da OFL 1.1 + atribuições). Linhas de copyright vêm dos repositórios oficiais; não consegui ler a tabela `name` dos WOFF2 para conferi-las byte a byte.

## 3. Pedidos cruzados atendidos (Astra/coordenador)

- **Abas de status no DataTable** (`components/datatables/StatusTabs.tsx`): botões `aria-pressed` sobre as opções do dropdown principal (`dropdownKey` '0') de `customFilters`, usando o mesmo `setCustomFilterIfChanged`. Sem contagens. Filtros de outros dropdowns são preservados; multiseleção feita no seletor avançado continua valendo (nenhuma aba fica ativa). Ativação: prop `withStatusTabs` ou automaticamente dentro de `.allberto-entity-list` — não editei páginas do Astra.
- **Badge/DataTable globais**: forma de selo (pill 11 px/600) mantendo cores de status personalizáveis; cabeçalho de tabela em caixa alta 10,5 px, hover indigo 2%. Estilos inline explícitos (`styleOptions`) continuam prevalecendo.
- **Máscara nas telas de entidade — NÃO implementada por CSS**, de propósito: seletores com blur/transparência mantêm texto e nome acessível legíveis. Para habilitar de verdade, cada tela do Astra deve chamar `usePrivacySupport()` e formatar com `maskValue(useHideValues(), texto)` (ou `MASKED_VALUE`) em valores, tooltips e `aria-label`. Enquanto isso, o botão não aparece nessas telas (sem privacidade fictícia).

## 4. Arquivos

Modificados: `src/common/colors.ts`, `src/components/{Badge,CompanySwitcher,DataTable,HelpSidebarIcons,Notifications,QuickCreatePopover}.tsx`, `src/components/cards/Card.tsx`, `src/components/forms/Button.tsx`, `src/components/layouts/Default.tsx`, `src/components/layouts/components/{DesktopSidebar,MobileSidebar,SidebarItem}.tsx`, `src/pages/dashboard/Dashboard.tsx`, `src/pages/dashboard/components/{Activity,Chart,DashboardCard,ExpiredQuotes,PastDueInvoices,RecentPayments,Search,Totals,UpcomingInvoices,UpcomingQuotes,UpcomingRecurringInvoices}.tsx`, `src/pages/dashboard/hooks/useGenerateActivityElement.tsx`, `src/resources/css/app.css` (1 linha `@import`), `index.html` (título, theme-color, descrição, favicon SVG), `.env.example` (`VITE_APP_TITLE="allberto"`), `tests/unit/components/DefaultHookOrder.test.ts` (mock do novo `Topbar`).

Novos: `src/resources/css/allberto.css`, `src/components/layouts/components/Topbar.tsx`, `src/components/layouts/common/{allberto-navigation,privacy}.ts`, `src/components/datatables/StatusTabs.tsx`, `src/pages/dashboard/components/allberto/{PositionToday,Sections,States}.tsx`, `src/pages/dashboard/helpers/allberto-dashboard.ts`, `src/pages/dashboard/hooks/{useAllbertoQueries,useDashboardFormatMoney}.ts`, `public/allberto/fonts/*` (4 WOFF2 + `OFL.txt`), `public/allberto/favicon.svg`, `tests/unit/allberto-{shell,dashboard}.test.ts`, `tests/browser/fixtures/allberto-shell/{index.html,main.tsx,network.ts}`, `docs/handoffs/opus-evidence/*.png`, este documento.

## 5. Testes e checagens (executados)

| Comando | Resultado |
| --- | --- |
| `npx vitest run tests/unit/allberto-shell.test.ts tests/unit/allberto-dashboard.test.ts tests/unit/components` | 11 arquivos, 67 testes passaram |
| `npx vitest run` (suíte unitária completa, após o Astra concluir) | 42 arquivos, 317 testes passaram |
| `npx biome lint` nos meus diretórios/arquivos | sem erros |
| `npx tsc --noEmit -p tsconfig.json` | **exit 1**, mas nenhum erro em arquivo meu: 2 em `tests/unit/allberto-entities-overview.test.ts` (TS2352, Astra) e 1 em `playwright.allberto-local.config.ts` (não criado por mim). |
| `git diff --check` no meu escopo | limpo |

Cobertura dos testes novos: posição atual (vencido = total − current, objeto vazio = zero legítimo, moeda ausente/valor inválido = indisponível, uso da chave 999 sem somar moedas), recebido do mês (erro ≠ zero), dias de atraso e vencimento de parcela, janela de 7 dias e detecção de lista truncada, reordenação do menu sem perder módulos (inclui módulo desconhecido) e respeitando visibilidade, item ativo `/invoices` vs `/recurring_invoices`, máscara sem dígitos, abas de status preservando outros dropdowns e multiseleção.

Não executei: build de produção, E2E upstream (resetam contas), qualquer chamada a backend real.

## 6. Evidência visual (fixture local)

`tests/browser/fixtures/allberto-shell/` renderiza o `Default` e o `Dashboard` reais com Redux/Jotai/React Query em memória e **adapter axios substituído** (nenhuma requisição sai do navegador; dados fictícios rotulados). Servida por `npx vite --port 5199` em `/tests/browser/fixtures/allberto-shell/index.html?theme=dark&hide=1&mini=1&state=data|empty|loading|error`. Observação: `DataTable` importa `emitter` do entrypoint `$app`; a fixture usa `#fixture-root` para que o App real não monte.

Medições no Chrome (DevTools, viewport emulado):

- 1440 × 1000: topbar 56 px; sidebar 236 px; folha em x=236, y=72; H1 32 px; Geist e Albert Sans carregadas (`document.fonts.check`); sem scroll horizontal do documento.
- 390 × 844 (mobile): H1 26 px; KPIs 2 × 173 px; calendário `clientWidth 356 / scrollWidth 656` (rolagem local; a spec mediu 668 com dados do protótipo); `scrollWidth` do documento = 390; botões da barra 40 px.
- Gaveta: `role=dialog`, `aria-modal=true`, foco inicial em “Fechar”, 9 links; Escape (tecla real) fecha e devolve o foco ao botão Menu.
- `hide=1`: nenhum padrão monetário em texto, `aria-label` ou `title` do Painel; gráfico removido.
- `mini=1`: sidebar 72 px, links com nome acessível.
- `state=error`: 4 alertas nos KPIs após as novas tentativas, nenhum valor exibido. `state=loading`: 4 KPIs `aria-busy`, 3 regiões `role=status`, nenhum valor.

Capturas: `docs/handoffs/opus-evidence/painel-1440-claro.png`, `painel-1440-claro-full.png`, `painel-1440-escuro-oculto.png`, `painel-1440-erro.png`, `painel-1440-carregando.png`, `painel-390-claro.png`, `gaveta-390-aberta.png`. Comparação com a proposta foi visual (mesma hierarquia/ordem/medidas acima); não houve diff de pixels.

## 7. Limitações verificadas e lacunas de dados

1. **Sem backend**: endpoints, formatos e permissões foram verificados no código upstream e na fixture, não em servidor real.
2. **Recusas de cartão** (motivo, código, tentativas), **validade de cartão** e “Pedir novo cartão”: sem contrato no frontend; não exibidos. “Precisa de ação” = só faturas vencidas.
3. ~~Conta nova não implementada~~ — implementada na fase 2 (§8).
4. **Recebido vs previsto** (barra “21% do previsto”) e sparkline do MRR: omitidos; recebido inclui pagamentos não recorrentes, então a razão seria enganosa. `analytics_summary` traz série de MRR, não integrado.
5. **Maiores contratos**: valor por emissão, sem conversão de moeda/frequência; sem barra de participação.
6. **Em atraso** usa `due_date` do aging do backend; a data “mais antiga” usa a mesma regra do card original (parcela quando houver).
7. **Recentes** no menu e contador de vencidas no item Faturas: não implementados (exigiriam consultas em todas as páginas / histórico inexistente).
8. Períodos “3/6/12 meses” da proposta: mantido o seletor real do Ninja (mais completo).
9. ~~Ícones do rodapé como `div`~~ — corrigido na fase 2 (§8).
10. Notificações seguem a preferência `enable_public_notifications`; na fixture ficam ocultas.
11. ~~Chaves `allberto_*` fora dos idiomas~~ — corrigido na fase 2 (§8).
12. ~~Zoom 200 % e 320 px não medidos~~ — medidos na fase 2 (§8).

## 8. Fase 2 — conclusão das pendências (19/11/2026)

Escopo autorizado: `src/resources/lang/{pt_BR,en}` além do anterior. Arquivos do Astra não editados (a fixture apenas **importa** `pages/clients/index/Clients.tsx`). Sem commit/push/deploy/E2E/rede externa.

### Log de correções

| # | Correção | Arquivos |
| --- | --- | --- |
| 1 | **i18n**: 55 entradas `allberto_*` anexadas ao fim de `pt_BR.json` e `en.json` (sem reformatar o restante; JSON validado). `defaultValue` removido do código. Fallback real do app: `fallbackLng: 'en'` em `src/index.tsx` — demais idiomas exibem inglês, sem copiar PT. **Achado**: o app usa códigos com sublinhado (`pt_BR`) e o resolvedor de plural do i18next 22 não os reconhece (caía no inglês). Solução local, sem mudar a config global: `helpers/allberto-i18n.ts` (`pluralKey` via `Intl.PluralRules('pt-BR')`, zero → plural) e variável `{{n}}` nas chaves plurais (`_one/_other`). | `src/resources/lang/{pt_BR,en}/*.json`, `pages/dashboard/helpers/allberto-i18n.ts`, `allberto/{PositionToday,Sections}.tsx`, `Topbar.tsx`, `Totals.tsx`, `Dashboard.tsx` |
| 2 | **HTTP 403/404**: `request()` interceptado resolve `undefined` em 403/404. `analytics_totals` agora usa `skipIntercept: true` (padrão de `project-analytics`/`useTaskMetricFieldsSupport`) via `fetchAnalyticsTotals`; `classifyHttpError` → `forbidden` / `unsupported` (404/405) / `unauthenticated` / `handled` / `other`; `shouldRetryDashboardQuery` só repete `other` (≤2). As demais consultas do Painel mantêm o interceptor global (toasts, 401/sessão) e passam por `requireResponseData`, que converte `undefined` em erro `handled` (sem repetição, nunca lista vazia). Interceptor global não alterado. Mesma proteção aplicada ao `Activity` do Painel (antes 403/404 aparecia como lista vazia). Com `skipIntercept`, um 401 em analytics vira erro no card; a expiração de sessão continua tratada pelas demais consultas interceptadas da página. | `helpers/allberto-http.ts`, `hooks/useAllbertoQueries.ts`, `allberto/States.tsx`, `components/Activity.tsx` |
| 3 | **Mensagens**: sem caminho de API/implementação na UI: “Indicador indisponível nesta versão do servidor.” / “Recurso indisponível nesta versão do servidor.”. Detalhe técnico só aqui. | `States.tsx`, `PositionToday.tsx`, idiomas |
| 4 | **HelpSidebarIcons**: 9 `div` clicáveis → `button type="button"` com `aria-label` (traduções existentes), `aria-pressed` em modo escuro e recolher menu, `nav aria-label="Ajuda"`, foco com anel duplo nos dois temas, alvo 36 px (44 px ≤ 860 px). Handlers, About (licença/versão), suporte, update/crons e mini-sidebar preservados. | `HelpSidebarIcons.tsx`, `allberto.css` |
| 5 | **Primeiros passos (conta nova)**: cartão acima da posição. Etapas: conta criada (sessão existente) · gateway (`useCompanyGatewaysQuery`, só admin) · cliente (`/api/v1/clients?status=active,archived&per_page=1`, só com `view_client`) · recorrente (idem com `view_recurring_invoice`). Estado vem do `meta.pagination.total`; sem permissão/erro/resposta interceptada → “não verificada” (nunca concluída/pendente). Só aparece se ≥1 etapa comprovadamente pendente. CTAs reais e por permissão: `/settings/gateways/create` (admin), `/clients/create` (`create_client`), `/clients/import` (`create_client`/`edit_client`), `/recurring_invoices/create` (`create_recurring_invoice`). Zeros legítimos dos KPIs mantidos; nada inferido de MRR/saldo. | `allberto/Onboarding.tsx`, `helpers/allberto-dashboard.ts` (`stepFromTotal`, `shouldShowOnboarding`, `paginationTotal`), `hooks/useAllbertoQueries.ts` (`useEntityTotal`), `Dashboard.tsx`, `allberto.css` |
| 6 | **320 px**: KPIs em coluna única ≤ 360 px e valor sem quebra. | `allberto.css` |
| 7 | **DataTable mobile (pedido do coordenador/Astra)**: em `.allberto-entity-list` ≤ 860 px cada linha vira cartão de duas colunas com rótulo + valor para **todas** as colunas configuradas; principal em largura total; seleção e Ações na 1ª linha; cabeçalhos viram faixa de chips de ordenação (sort e selecionar-todos preservados). Marcação opt-in mínima: `Td` ganhou `dataLabel`/`dataCell` (`data-label`, `data-ab-cell`); `DataTable` preenche com `column.label`. Desktop e tabelas fora do escopo intactos (verificado: `display: table-row`, sem pseudo-rótulo). | `components/tables/Td.tsx`, `components/DataTable.tsx`, `allberto.css` |

### Testes e checagens desta fase

| Comando | Resultado |
| --- | --- |
| `npx vitest run tests/unit/allberto-{shell,dashboard,dashboard-http,i18n}.test.ts tests/unit/components/DefaultHookOrder.test.ts` | 5 arquivos, 25 testes passaram |
| `tests/unit/allberto-dashboard-http.test.ts` | `request.ts` real com adapter axios substituído: 404 → `unsupported`, 403 → `forbidden`, AxiosError preservado, **1 chamada** e sem retry; 500 → até 2 novas tentativas; 403 no cliente interceptado → `undefined` → erro `handled` sem retry |
| `tests/unit/allberto-i18n.test.ts` | mesmas chaves/variáveis em pt_BR e en; toda chave usada no código existe (plurais com `_one/_other`); i18next real: “Em atraso há 1 dia/13 dias”, “8 faturas em aberto · R$ 1,00 já vencido”, “1 client/2 clients”, `de` → inglês; `pluralKey` (zero, código inválido) |
| `npx biome lint` (meus arquivos) | sem erros |
| `npx tsc --noEmit -p tsconfig.json` | **exit 0** (somente leitura; build não executado) |

Não executei build nem suíte completa nesta fase (coordenador fará). Formatei apenas meus arquivos; reformatação acidental de `layouts/Settings.tsx` foi revertida (diff só de espaços).

### Evidência na fixture local (rede interceptada, dados fictícios)

Novos parâmetros: `?lang=en`, `?analytics=404|403`, `?route=/clients` (página real do Astra, importada).

- `state=empty` (1440): etapas `done` conta · `pending` gateway/cliente/recorrente com CTAs `/settings/gateways/create`, `/clients/create`, `/clients/import`, `/recurring_invoices/create`; KPIs `R$ 0,00` mantidos; nenhuma chave crua. Captura `opus-evidence/painel-1440-conta-nova.png`.
- `state=data`: cartão de primeiros passos ausente (tudo comprovado).
- `analytics=404&lang=en`: 3 alertas “This indicator is not available on this server version.”, 0 botões de retry, título “Position today”.
- `analytics=403`: 3 alertas “Sem permissão para ver estes dados.”, 0 retry; “Recebido” continua com valor (consulta independente).
- **320 × 700** (mobile): `scrollWidth` 320; topbar cabe exatamente (6 controles de 40 px + logo); H1 26 px; KPIs 288 px em coluna única, valor em 1 linha (23 px). Captura `painel-320-claro.png` (antes da correção, mostra a quebra que motivou o ajuste).
- **Zoom 200 %** (1440×1000 → viewport CSS 720×500, DPR 2, tema escuro): layout mobile, sidebar oculta, botão Menu visível, `scrollWidth` 705 ≤ 720; foco em botão de ajuda da gaveta com anel `#7e85ff`.
- Rodapé de ajuda desktop (claro): botões “Contate-nos (Slack)”, “Fóruns de suporte”, “Guia do Usuário”, “Sobre”, “Modo Escuro [aria-pressed=false]”, “Ocultar Menu [aria-pressed=false]”; foco com anel `#545dff`; “Sobre” abre o modal (licença/versão).
- Clientes 390 px: 2 linhas em cartão (`display: grid`), células `select | primary Nome | Saldo | Pago até a data | Email de Contato | Estado | actions`, `scrollWidth` 390, sem rolagem horizontal da lista (358/358). Captura `clientes-390-lista-mobile.png`. Desktop 1440 mantém `table-row`.

### Limitações remanescentes desta fase

- Na gaveta mobile, `HelpSidebarIcons mobileNavbar` mostra só o botão de recolher menu (comportamento upstream); About/suporte ficam acessíveis no desktop/zoom > 860 px.
- Chip vazio do cabeçalho da coluna de ações aparece na faixa de ordenação mobile (o `th` tem conteúdo de redimensionamento, não é `:empty`).
- Abas de status do DataTable só aparecem onde a página fornece `customFilters` (Clientes usa o seletor de estado padrão, não `customFilters`).
- A cópia vazia/erro das atividades das telas do Astra (`invoices/edit/components/Activities.tsx`) não foi tocada; a do Painel foi corrigida.
- Nenhuma validação contra servidor real.

## 9. Fase 3 — correções da revisão integrada (`docs/reviews/fable-integrated.md`)

Autorização adicional: `src/common/hooks/useRefetch.tsx`. Não editei arquivos em uso pelo Astra (DataTable, CSS `.ab-sheet`, SidebarItem, Activities das entidades, harness, `tests/local`).

| Achado | Correção | Arquivos |
| --- | --- | --- |
| 1 — moeda/falso erro | `resolvePositionCurrency(resposta, preferência, moeda da empresa)`: 999 se escolhida; a preferência se a **própria resposta** tiver essa moeda (escolha explícita válida); senão a moeda da empresa (cobre o padrão `1` injetado por `preferencesDefaults` numa empresa BRL); senão `null`. Resolve a partir de `analytics_totals` e, se ele falhar, de `totals_v2` do mês — não depende do Histórico/`Totals`. Resposta 200 sem a moeda → estado **neutro** “Sem dados nesta moeda.” (sem `role=alert`, sem zero). Selo “Moeda: BRL” mostra a moeda efetivamente usada (código vindo da resposta). Nenhuma conversão ou soma no cliente. Também alinhei “N clientes · mais antiga” do KPI Em atraso à mesma moeda e ao `due_date` vencido (`overdueRowsForPosition`), como o aging do backend. | `helpers/allberto-dashboard.ts` (`resolvePositionCurrency`, `currencyCodeOf`, `MISSING`, `Read<T>`, `overdueRowsForPosition`), `allberto/PositionToday.tsx` |
| 2 — privacidade | `adjustment` (estorno) recebe a mesma máscara de `payment_amount`. Notas livres: com a máscara ligada, o **conteúdo inteiro** é substituído por “nota oculta” (sem heurística numérica); o link para a entidade continua. | `hooks/useGenerateActivityElement.tsx`, idiomas |
| 3 — KPIs desatualizados | `'/api/v1/charts/analytics_totals'` nas dependências de `invoices`, `payments`, `recurring_invoices`, `clients`, `credits`. Consumidor único da chave: `useAnalyticsTotals`. As consultas novas do Painel já usam chaves com prefixo `/api/v1/invoices` e `/api/v1/recurring_invoices`, invalidadas pelos recursos correspondentes. | `src/common/hooks/useRefetch.tsx` |
| 4 — textos | Dica “Recebido”: “…descontados estornos; inclui pendentes”. “Precisa de ação”: linha com parcela vencida e vencimento final futuro ganha selo “parcela vencida” e a linha “Parcela: R$ X” separada do Saldo (cada valor rotulado; não mistura). “Maiores contratos” → “Maiores valores por emissão”, lista sem numeração (`ul`), dica explicita que moedas/frequências não são comparáveis. | `allberto/Sections.tsx`, `helpers/allberto-dashboard.ts` (`isPartialOnlyOverdue`), idiomas |

Novas chaves (pt_BR/en): `allberto_currency_no_data`, `allberto_note_hidden`, `allberto_partial_overdue`, `allberto_partial_amount`; textos alterados: `allberto_paid_hint`, `allberto_top_contracts`, `allberto_top_contracts_hint`.

### Testes desta fase (focados)

`npx vitest run tests/unit/allberto-{shell,dashboard,dashboard-http,i18n,dashboard-currency,dashboard-activity-privacy,dashboard-refetch}.test.ts tests/unit/components/DefaultHookOrder.test.ts` → **8 arquivos, 42 testes passaram**. `npx biome lint` nos meus arquivos: limpo. Não rodei suíte completa, build nem `tsc` global (coordenador).

- `allberto-dashboard.test.ts`: BRL com padrão 1 → `12`/“BRL”; escolha explícita válida (2) e 999 preservadas; moeda ausente → `MISSING` em posição e recebido; chave `currencies` nunca vira moeda; filtro de vencidas por moeda/due_date; detecção de parcela vencida.
- `allberto-dashboard-currency.test.ts` (render real de `PositionToday`, consultas mockadas): empresa BRL + preferência 1 + **totais do mês com erro** → MRR/Em atraso em BRL, só o cartão Recebido em erro; moeda explícita válida; resposta 200 sem a moeda → 0 alertas, texto neutro, nenhum zero.
- `allberto-dashboard-activity-privacy.test.ts` (render real do elemento de atividade com o modelo `activity_40` do idioma en): sem máscara mostra R$ 1.200,00/R$ 6.800,00; com máscara nenhum padrão monetário, `••••••` e “nota oculta”, número do pagamento preservado.
- `allberto-dashboard-refetch.test.ts` (`QueryClient` real + `useRefetch`): `invoices/payments/recurring_invoices/clients/credits` invalidam `analytics_totals`; `tax_rates` não; consulta não relacionada intacta.

### Limites que permanecem

- Máscara de notas oculta o texto inteiro; não há como mascarar só valores sem heurística.
- Se a preferência explícita for uma moeda sem dados na resposta, a posição usa a moeda da empresa (selo mostra qual) — o seletor do Histórico continua com a escolha do usuário.
- Fuso: dias em atraso, mês corrente e “parcela vencida” usam o relógio do navegador (achado informativo 8, não alterado).
- Onboarding segue fazendo duas contagens por abertura (informativo 8, não alterado).
- Sem validação contra servidor real.

**Fonte do Opus congelada nesta fase.**
