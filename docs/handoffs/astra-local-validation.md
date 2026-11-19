# Validação local isolada — Allberto

19/11/2026. Responsável: Astra / Scaffold. Não existe backend de homologação; esta validação não acessa produção.

## Execução

```sh
npx playwright test --config playwright.allberto-local.config.ts
```

A configuração inicia Vite em `127.0.0.1:4178`, usa Chrome instalado, um worker, zero retries e somente `tests/local/allberto*.spec.ts`. Não importa `playwright.config.ts`, `tests/e2e/global-setup`, fixtures autenticadas upstream, `.env`, reset de conta, build ou servidor de produção. O Chromium próprio do Playwright não estava instalado; não foi baixado.

Para inspeção manual local (se a porta estiver livre):

```sh
npx vite --config tests/local/vite.config.ts
```

Abrir `/tests/local/index.html?route=%2Fdashboard&theme=light` no endereço localhost acima; `route` aceita também `/clients`, `/clients/local-client`, `/invoices`, `/invoices/local-invoice`, `/recurring_invoices` e `/payments`; `theme=dark` inicia tema escuro; `lang=pt_BR` carrega o recurso pt_BR real e locale de data português. Esse HTML existe somente em tests/local e não é rota da aplicação de produção.

## O que é real e o que é fixture

- Componentes reais: Default, topbar, navegação desktop/mobile, DataTable, cards/botões/tabs, Dashboard completo, quatro listas, Client + Outlet de invoices/histórico e Invoice + Overview. Importam CSS/fontes locais reais. Não há HTML espelhado do protótipo.
- Redux, React Query, Jotai e router reais. Um único usuário/empresa fictícios é semeado para renderizar páginas com perfil administrador; a inicialização de login/guards não é montada.
- Somente efeitos de entrada foram isolados: alias exato `$app` fornece o emitter mitt; `$app/App` fornece o átomo do banner de atualização. Isso evita bootstrap da aplicação inteira, Sentry, OAuth e montagem das rotas externas ao escopo. Não substitui os hooks de dados das páginas.
- Conta, cliente, invoice, recorrente, pagamento, statics e agregados são **dados fictícios de teste**, identificados por `local-*`, “fixture local” e `example.invalid`. Uma moeda USD e um registro de cada família. Isso não representa contratos/valores de clientes reais.
- A query de versão pública hard-coded da sidebar é semeada no cache (`/pdf.invoicing.co/api/version`) para não consultar esse serviço. Não alterada em produção.

## Isolamento de rede

O Vite de teste não lê env nem configura proxy. API aponta explicitamente para localhost. Middleware aceita apenas endpoints de leitura listados em `fixtures.ts`; URLs não mapeadas e qualquer gravação retornam 501. POST de search, charts, activities/entity e emails/clientHistory são operações de **leitura** já usadas pela aplicação. GET payments/create e invoices/create fornecem apenas modelos vazios usados pelo ciclo dos componentes existentes; não criam registros.

CSP restringe recursos/conexões ao próprio servidor (incluindo WebSocket Vite local), data/blob; bloqueia frames e submissão de formulário. Playwright adiciona interceptação independente de todas as requisições, aborta saída externa e falha se houver URL externa ou API não mapeada. Service workers são bloqueados. Cada teste anexa auditoria de método/URL, chamadas bloqueadas e erros JavaScript; não registra credenciais.

## Verificações e evidências

Matriz final: **13/13 testes passaram em 1,9 minuto, exit 0 natural**, após congelamento de Tabs/SelectField. Comando executado com `DEBUG=pw:browser` apenas para diagnóstico; log confirma `<process did exit: exitCode=0, signal=null>` e `<gracefully close end>`. Nenhuma intervenção/kill, timeout ignorado ou retry nesta rodada. A execução anterior de 12 cenários ficou pendente no teardown e exigiu encerramento manual; não foi considerada limpa e seu log está preservado em `run-worker-teardown-interrupted.log`. A causa exata daquele travamento transitório não foi comprovada; não se repetiu no suplemento nem na matriz final. A rodada anterior expôs overflow desktop causado pelo novo label acessível de Ações, corrigido posicionando o cabeçalho; o teste manteve a exigência original de largura. O smoke pt_BR exigia nome incompleto do heading com badge; passou com o nome acessível exato “Precisa de ação 1”. A fixture de chart_summary_v2 recebeu datas de início/fim e arrays por moeda conforme Totals/Chart e ChartService; agora exige ausência de “Invalid Date” e renderiza curvas.

- Sete superfícies × quatro combinações: dashboard, clients, client detail, invoices, recurring invoices, payments, invoice overview em **1440×1000 / 390×844, light/dark**. Assert de conteúdo servido, tema no documento, ausência de erro de renderização e `scrollWidth <= viewport + 1`. Capturas full-page.
- Smoke pt_BR em 1440/390: labels portugueses reais, ausência de allberto_* e interpolação crua, singular '1 fatura em aberto', Refresh recebe agregado de 2 faturas e valida plural '2 faturas em aberto'. Capturas pt-BR anexadas ao relatório. EN agora exige 'Monthly recurring revenue', não apenas um número.
- Drawer mobile: abre como dialog, foco inicial no botão Close, Shift+Tab permanece dentro, Escape fecha e devolve foco ao Menu, link Clients navega pela rota real do harness e fecha a gaveta.
- Filtro Paid: clique no componente StatusTabs integrado ao DataTable altera a requisição real `/api/v1/invoices?...client_status=paid&page=1`, muda `aria-pressed`, mostra resultado vazio da fixture e All recupera registro. `client_status` é o nome usado pelo contrato frontend existente (`useInvoiceFilters` + `useDataTableUtilities`, fallback quando option.queryKey não existe). **Não é prova do comportamento do backend**, que não foi chamado.
- Overview: resposta persistida renderiza 1200/600 na moeda do cliente; Ctrl+S não dispara gravação. Nenhuma mutation financeira é permitida pelo fixture server.
- Tabs mobile: seletor mostra Overview, abre por teclado sem erro quando existem abas disabled, navega Activity e retorna Overview acompanhando o href ativo. Componente real e rota Activity real montados no harness. Suplemento isolado **1/1 passou em 5,5 s com encerramento natural**.
- Loading/error/retry: primeira leitura de invoice é retida para observar status nomeado, depois retorna 500 sintético; Refresh faz segunda leitura bem-sucedida.
- Regressão financeira separada: `npx vitest run tests/unit/allberto-entities-overview.test.ts` **7/7** após a correção Fable. O teste usa InvoiceSum real em clone editável e mantém snapshot servidor intacto (ver handoff de entidades).
- `npx tsc --noEmit --pretty false` autorizado pelo coordenador: **exit 0**, log vazio em `tests/local/artifacts/types.log`, após completar fixtures Invoice/Client tipadas e corrigir reducedMotion para contextOptions. Não rodado build/full suite por este agente.

Auditoria final: **13 arquivos, 418 leituras de API local, 0 URLs externas/não mapeadas, 0 erros JavaScript não tratados**. **33 PNGs** na matriz final. Revisão visual de dashboard PT1440/390, listas mobile claro/escuro e overview390dark confirmou datas, textos, cartões, ausência de chip vazio e seleção Overview. Sem comparação automatizada de pixels.

Artefatos locais (ignorados pelo Git, permanecem no workspace):

- `tests/local/artifacts/run.log`: resultado da matriz final.
- `tests/local/artifacts/report/index.html`: relatório Playwright, capturas e auditorias anexadas.
- `tests/local/artifacts/results/allberto-surfaces-integrated-surfaces-{1440|390}px-{light|dark}/`: sete PNGs por combinação.
- `tests/local/artifacts/orca-dashboard-1440-light.png` e `orca-overview-390-dark.png`: inspeção manual pelo Orca CLI, conforme skill orca-cli. DOM mobile observou largura/scrollWidth 390, tema dark, drawer aberto com foco Close e recursos externos `[]`. As capturas de animação da gaveta no Orca não servem como prova de foco/fechamento; esse aceite vem do teste Playwright determinístico. Tab e servidor manual encerrados.

## Achados e limites

- Desktop e detalhes usam estrutura/tokens Allberto. As quatro listas mobile usam **cartões de duas colunas**, com todos os campos, seleção, ações e cabeçalhos de ordenação preservados. O teste verifica display grid, duas colunas, checkbox e botão Actions. O chip vazio de Ações foi removido apenas no mobile por classe semântica; o cabeçalho desktop mantém label acessível e posição relativa para conter o sr-only. Desktop com muitas colunas conserva rolagem interna da tabela. Não afirmar fidelidade pixel a pixel.
- Harness carrega recursos reais en e pt_BR. Exige ausência de allberto_* e Invalid Date nas superfícies; smoke PT também rejeita interpolação crua e valida singular/plural por refetch real. Uma moeda USD é intencional na fixture, mesmo em pt_BR. Captura mobile confirmou que a ação de gateway quebra para a próxima linha sem cortar o texto.
- Activity da fatura com resposta 200 vazia agora usa `no_records_found` (“Nenhum registro encontrado”), nos consumidores Overview e aba Activity. Erro de rede continua no estado de erro/retry, sem ser mascarado como vazio.
- Risco Fable 5 (Combobox cortado por `.ab-sheet`) **não reproduzido** no Default real com página curta. O teste abre Combobox real, encontra opção com centro abaixo do limite da sheet, confirma `elementFromPoint` na opção e seleciona opção 8. Geometria anexada. Nenhum CSS de overflow alterado para esse risco; isso não prova todos os dropdowns/portais.
- Risco Fable 6 **reproduzido e corrigido**: drawer sobrepunha modal de alterações não salvas. NavLink protegido chama onNavigate antes de preventNavigation; MobileSidebar desmonta imediatamente apenas no fluxo de navegação, liberando o focus trap antes do modal. Escape/Close conservam animação. Teste com InputField, átomo e PreventNavigationModal reais comprova foco no modal, Continuar editando preserva rascunho/rota e Descartar navega. `unsaved-drawer-before.png` registra falha anterior, `unsaved-confirmation-390.png` estado corrigido.
- Quatro warnings React existentes em `CopyToClipboard` (fill-opacity, stroke-width, stroke-linecap, stroke-linejoin). Não são uncaught pageerrors. Não alterado componente compartilhado.
- Durante a inspeção houve erro transitório de parse em `useAllbertoQueries.ts` enquanto outro agente editava. Foi comunicado ao coordenador e resolvido; teste agora também detecta `vite-error-overlay`. A fonte foi congelada antes da execução final.
- Sem backend: não validados autenticação, guards reais, ACL servidor, persistência, criar/editar/salvar, enviar email, cobrar, estornar, exportar, PDF ou efeitos financeiros. Nenhuma dessas ações foi acionada. Rotas fora das sete superfícies são explicitamente marcadas fora do harness; isso não modifica as rotas de produção.
- Sem validação Firefox/Safari, auditoria WCAG completa, comparação automatizada de pixels ou múltiplas moedas na mesma conta. Evidência de layout é com uma linha por lista; paginação/bulk/export continuam upstream, mas não receberam aceite end-to-end aqui.
- Privacidade nas entidades não foi adicionada: controle permanece oculto onde não há suporte. Nenhum blur como substituto de máscara.

## Arquivos desta etapa

`playwright.allberto-local.config.ts`; `tests/local/.gitignore`; `tests/local/index.html`; `tests/local/main.tsx`; `tests/local/ShellChecks.tsx`; `tests/local/README.md`; `tests/local/runtime-bridge.ts`; `tests/local/fixtures.ts`; `tests/local/vite.config.ts`; `tests/local/allberto-surfaces.spec.ts`; este handoff. Correções Fable e fixture unitária estão discriminadas no handoff anterior. Sem dependências, commit, push, deploy ou acesso WHMCS/VPS.

## Acabamentos finais autorizados

Mudanças mínimas compartilhadas desta etapa: `DataTable.tsx` marca o cabeçalho Ações e contém seu sr-only; `allberto.css` oculta somente esse cabeçalho mobile; `SidebarItem.tsx` fecha drawer antes da confirmação de saída; `MobileSidebar.tsx` libera imediatamente o focus trap ao navegar. `Activities.tsx` usa tradução de vazio com resposta 200. Detalhes anteriores do Opus §8 sobre chip/vazio ficam superados por esses acabamentos; §9 de dashboard permanece preservado.

Correção adicional de teste autorizada pelo coordenador: `tests/unit/allberto-dashboard.test.ts` estreita explicitamente o resultado `CurrentPosition | missing | null` antes de acessar mrr/overdue, sem cast; **15/15** testes focados passaram. Checks globais/build ficaram com coordenador.

## Suplemento Tabs / SelectField

O seletor mobile recebia defaultValue com nome, enquanto as opções usam href. `Tabs.tsx` agora controla value pelo href da aba habilitada que satisfaz o isActive existente (incluindo matchers); backup navigation e handler navigate permanecem. O teste de abertura também reproduziu TypeError em opções false: `SelectField.tsx` mapeava filho inválido para false, que react-select rejeita. A causa compartilhada foi corrigida retornando null para filho inválido; nenhum refactor ou workaround nos callers. Abas desabilitadas continuam invisíveis.

A captura atualizada do suplemento está em `tests/local/artifacts/tabs-supplement/allberto-surfaces-mobile-i-736de-verview-and-activity-routes/invoice-overview-390-dark.png`. O teste usa teclado para abrir o combobox e clique na opção para navegar, e a auditoria termina com zero chamadas bloqueadas/erros. A abertura por nome de texto gerou ambiguidade com a aba desktop escondida; o locator foi delimitado ao grupo mobile. Nenhum force click ou bypass de guard.

## Quatro evidências finais selecionáveis

Todos os caminhos abaixo partem da raiz do repositório e foram gerados pela matriz final limpa:

- `tests/local/artifacts/results/allberto-surfaces-dashboar-c4dcb-se-labels-and-plural-1440px/dashboard-1440-pt-BR-light.png`
- `tests/local/artifacts/results/allberto-surfaces-dashboar-bf387-ese-labels-and-plural-390px/dashboard-390-pt-BR-light.png`
- `tests/local/artifacts/results/allberto-surfaces-integrated-surfaces-390px-light/clients-390-light.png`
- `tests/local/artifacts/results/allberto-surfaces-integrated-surfaces-390px-dark/invoice-overview-390-dark.png`

O coordenador pode copiar essas evidências para documentação versionada. Fonte congelada; sem commit/push por este agente.
