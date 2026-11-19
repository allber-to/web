# Revisão integrada — shell, Painel e entidades allberto (Fable 5.2)

Data: 19/11/2026. Base do diff: `26658be97`. Revisor: Claude Fable 5.2, somente leitura de código.
Estado revisado: checkout às 09:51, depois de 150 s sem alterações em `src/`, `tests/unit/` e `docs/handoffs/` (fase 2 do Opus concluída segundo o handoff §8).

## Aceite final (revalidação das 09:59)

**Aprovado no escopo de leitura de código.** Os três achados médios e o achado baixo de textos foram corrigidos; não encontrei regressão no delta. O aceite depende ainda do que não é meu: build do coordenador, matriz Playwright do Astra e validação contra servidor real.

Delta revisado: handoff do Opus §9 e os arquivos alterados entre 09:52 e 09:58 (`useRefetch.tsx`, `PositionToday.tsx`, `allberto-dashboard.ts`, `useGenerateActivityElement.tsx`, `Sections.tsx`, idiomas, `SidebarItem.tsx`, `DataTable.tsx`, `allberto.css`, `invoices/edit/components/Activities.tsx`).

| Achado | Situação | Como conferi |
| --- | --- | --- |
| 1. Moeda / falso erro | **Resolvido** | `resolvePositionCurrency` escolhe 999, depois a preferência se existir na própria resposta, depois a moeda da empresa. Resolve a partir de `analytics_totals` e, na falta dele, de `totals_v2` do mês; não depende mais do Histórico. Moeda ausente vira estado neutro sem `role="alert"` e sem zero. A chave `currencies` nunca é tratada como moeda. Nenhuma soma ou conversão no cliente. |
| 2. Estorno visível | **Resolvido** | `adjustment` recebe a mesma máscara (`useGenerateActivityElement.tsx:205`). Notas livres são substituídas inteiras por "nota oculta" nos dois ramos (`:209`, `:226`), sem heurística numérica. |
| 3. KPIs defasados | **Resolvido** | `analytics_totals` nas dependências de `invoices`, `credits`, `payments`, `clients` e `recurring_invoices` (`useRefetch.tsx:19,57,91,199,230`). |
| 4. Textos | **Resolvido** | "Recebido" declara pendentes; linha com só a parcela vencida ganha selo e valor da parcela rotulado, separado do saldo; "Maiores valores por emissão" em lista sem numeração. A contagem de clientes e a data mais antiga do KPI "Em atraso" agora usam a mesma moeda e o mesmo critério (`due_date` vencido) do backend. |
| 5. `overflow: hidden` da folha | Não alterado | O Astra informou não ter reproduzido em caso real. Fica como risco residual baixo, sem evidência minha em navegador. |
| 6. Gaveta móvel | **Resolvido** | `onNavigate` é chamado antes de `preventNavigation` (`SidebarItem.tsx:44-49`). |
| 7 e 8 | Mantidos como informativos | Sem mudança pedida. |

Acabamentos do Astra, agora presentes e conferidos:
- **Cabeçalho de Ações:** o `th` ganhou texto `sr-only` e a classe `ab-datatable-actions-heading`, oculta só na lista móvel (`allberto.css:1425`). Seleção e chips de ordenação não são afetados; no desktop o cabeçalho passa a ter nome acessível.
- **Atividade vazia:** usa `no_records_found`; o estado de erro continua separado (`Activities.tsx:87-102`).

Observação nova, informativa: os KPIs formatam sempre com duas casas (`PositionToday.tsx`, quarto argumento de `formatMoney`). Em moeda sem centavos (iene, peso chileno) aparecem ",00" supérfluos. O cartão de totais original faz o mesmo; não bloqueia.

Testes desta revalidação: 7 arquivos focados (`allberto-dashboard`, `-currency`, `-activity-privacy`, `-refetch`, `-shell`, `-i18n`, `-entities-overview`), **43 testes passaram**. Os testes de moeda, privacidade e invalidação renderizam os componentes reais e usam o `useRefetch` e o `QueryClient` reais, com as consultas simuladas.

Limites: os mesmos da seção final. Não vi o resultado do build nem da matriz de navegador; o erro de tipo em `tests/unit/allberto-dashboard.test.ts` citado pelo coordenador não foi verificado por mim (não rodei `tsc`).

### Suplemento — último delta (quatro diffs)

**Aceito por leitura de código; nenhum achado.** Li apenas os quatro diffs e seus pontos de chamada. Não rodei testes nesta rodada.

| Diff | Leitura |
| --- | --- |
| `MobileSidebar.tsx` — `closeForNavigation` | Ao navegar, a gaveta é desmontada no mesmo ciclo (`return null` quando `isNavigating && !sidebarOpen`), então a contenção de foco não sobrevive à animação de saída e não disputa com o modal de alterações não salvas. Todos os hooks ficam antes do retorno antecipado; ao reabrir, o efeito zera `isNavigating`. Fechar pelo X, por Escape ou por clique fora continua usando `close`, com animação. Efeito colateral: toda navegação pelo menu fecha a gaveta sem animação, o que é só cosmético. |
| `DataTable.tsx` — `relative` no `th` de Ações | O texto `sr-only` é posicionado em absoluto; sem ancestral posicionado ele escapava da célula. A classe o ancora. `Th` concatena `className`, sem outro efeito. |
| `Tabs.tsx` — seletor móvel controlado | `value` passa a ser o `href` da aba ativa e habilitada, o mesmo tipo de valor das opções (antes era `defaultValue` com o nome da primeira aba, que não correspondia a nenhuma opção). Sem aba ativa o valor é vazio. `SelectField` não dispara `onValueChange` por mudança de prop, então não há laço de navegação. |
| `SelectField.tsx` — `null` no lugar de `false` | `React.Children.map` descarta `null`, mas mantém `false` no resultado. Com opção condicional (`cond && <option>`), o `false` chegava ao seletor como entrada inválida. A troca remove essas entradas; opções válidas não mudam. |

Limite importante: não vi resultado de navegador. O coordenador informou que a matriz anterior passou nos 12 casos mas com encerramento forçado, e que uma nova rodada está em curso. **Não declaro o comportamento em navegador como limpo**; isso depende do resultado do Astra. O suplemento local de teclado (1/1) e os resultados de suíte, lint e build foram informados pelo coordenador, não verificados por mim.

O restante deste documento é o registro da revisão das 09:51, antes dessas correções.

## Veredito da revisão das 09:51

**Aprovado com ressalvas para validação local; requer três correções médias antes do aceite do Painel.**

- **Entidades:** bloqueio financeiro resolvido. Aprovadas no escopo.
- **Shell e componentes compartilhados:** sem regressão encontrada por leitura. Dois riscos não verificáveis sem navegador (achados 5 e 6).
- **Painel:** contratos do backend conferidos na fonte upstream e corretos. Três achados médios (1, 2, 3) afetam número exibido, privacidade declarada ou consistência entre cartões.

Nenhum arquivo em mutação impediu fechar a revisão; nada mudou depois das 09:43.

## Revalidação das entidades

| Achado original | Situação | Como conferi |
| --- | --- | --- |
| 1. Visão geral com valores recalculados (alta) | **Resolvido** | `Invoice.tsx` passa `persistedInvoice: data?.id === id ? data : undefined`; `Overview.tsx:24` usa só esse objeto. `data` não é alterado: o efeito clona antes de gravar no átomo. O teste agora roda o `InvoiceSum.build()` real sobre o clone editável e confirma que a tela continua em 100 / 20 / 72 e não mostra rascunho não salvo. |
| 2. Cache de atividade sem tipo de entidade (média) | **Resolvido** | Chaves tipadas em cliente, fatura (aba, slider, e-invoice, Verifactu), recorrente (aba, slider) e pagamento. A invalidação por prefixo em `useRefetch.tsx` continua cobrindo. |
| 3. Editar desabilitado na visão geral | **Resolvido** | Bloqueios aplicados só fora da visão geral. |
| 4. Dois caminhos "Editar" | Mantido por decisão | Documentado pelo Astra; decisão de produto. |
| 5. Título e breadcrumb | **Resolvido** | |
| 6. Histórico espremido e sem erro | **Resolvido** | Cartões empilhados; erro e nova tentativa independentes. |
| 7. CSS da célula de nome | **Resolvido** | Importado no hook. |
| 8. Acessibilidade estrutural | **Resolvido** | Texto `sr-only` nos carregamentos, `section` nomeada, acionador do modal como botão. |
| 9. Totais sem imposto/desconto | **Resolvido** | Usa `total_taxes` e `discount` persistidos, sem recalcular. |

Resíduo menor: os links de fatura do Painel ("Precisa de ação", `Sections.tsx:143`) abrem o editor, enquanto as listas abrem a visão geral. Inconsistência de destino, não de dados.

## Contratos do backend conferidos

Li as fontes públicas de `invoiceninja/invoiceninja` (`v5-develop`; rota confirmada também em `v5-stable`): `ChartController`, `ChartService`, `AnalyticsQueries`, `ChartQueries`, `ShowChartRequest`, `InvoiceFilters`, `RecurringInvoiceFilters`, `RecurringInvoiceTransformer`, modelo `RecurringInvoice`.

- **MRR:** soma de `recurring_invoices.amount` com `status_id = 2`, normalizada por frequência, agrupada pela moeda do cliente. A chave `999` divide pela taxa de câmbio de cada documento. O rótulo e a dica do Painel descrevem isso corretamente.
- **A receber / Em atraso:** saldo de faturas com status 2 ou 3 e `balance > 0`. Em atraso = `total − current_amount`, com "hoje" no fuso da empresa. Independe do período. Correto.
- **Recebido no mês:** `sum(amount − refunded)` de pagamentos com status 1, 4, 5, 6, por moeda do pagamento, datas do mês calculadas pelo backend (`date_range: this_month`). Ver achado 4 sobre o status 1.
- **Permissões:** as rotas de gráfico exigem administrador ou `view_dashboard`; quem não é administrador recebe só os próprios registros. A rota `/dashboard` do frontend tem o mesmo guard. O Painel não consulta nada além do que o backend já restringe.
- **Recorrentes:** `client_status=active` filtra status ativo; `next_send_date` chega como data `AAAA-MM-DD` sem conversão, então a comparação por dia do calendário é segura.
- **Cache do servidor:** TTL zero em `analytics_totals`; não há cache a invalidar no backend.

## Achados

### 1. MÉDIA — KPIs da "Posição hoje" aparecem como erro quando a moeda preferida não existe na resposta

**Onde:** `Dashboard.tsx:54` (`preferences.dashboard_charts?.currency || 1`), `allberto-dashboard.ts:69-73`, `PositionToday.tsx:119-128`. O padrão das preferências é moeda `1` (`useReactSettings.ts:136`).

**O que acontece:** o backend só devolve chaves para moedas em uso na empresa. Numa empresa em BRL, um usuário sem preferência salva pede a moeda 1, que não existe na resposta. `readCurrentPosition` devolve `null`, e os quatro KPIs mostram o alerta "não foi possível carregar" com `role="alert"`, embora a consulta tenha dado certo.

**Por que não se corrige sozinho sempre:** quem ajusta a preferência é um efeito de `Totals.tsx:258-276`, que depende da consulta do histórico. Se ela demorar, o alerta falso pisca; se falhar (ou for interceptada por 403), o alerta fica, e "Tentar de novo" não resolve.

**Menor correção:** usar a moeda da empresa como padrão (`Number(company.settings.currency_id)`) em `Dashboard.tsx`, e tratar "consulta ok, moeda ausente" como estado neutro (carregando ou "sem dados nesta moeda"), não como erro.

### 2. MÉDIA — Valor de estorno continua visível com "ocultar valores" ligado

**Onde:** `useGenerateActivityElement.tsx:200` (`adjustment: activity?.adjustment?.label`). Só `payment_amount` é mascarado (`:162-164`).

**Cenário:** com valores ocultos, uma atividade de estorno ("… estornou :adjustment de um pagamento de :payment_amount …") mostra o valor estornado em claro no cartão de atividade do Painel.

**Menor correção:** aplicar `MASKED_VALUE` também a `adjustment`.

**Limite conhecido, sem correção possível por máscara:** `notes` é texto livre e pode conter valores digitados pelo usuário. Vale registrar na descrição do recurso.

Demais superfícies conferidas e cobertas: KPIs, listas novas, cartões originais, cartões configuráveis, totais do período, tooltip do gráfico (gráfico e barra de proporção são removidos), `aria-label` e `title`. Não há blur. As telas de entidade não declaram suporte e o botão não aparece nelas; ao sair do Painel com a máscara ligada, os valores voltam a aparecer nas outras telas, o que é coerente com a limitação declarada.

### 3. MÉDIA — KPIs ficam desatualizados depois de ações feitas no próprio app

**Onde:** `useAllbertoQueries.ts:49` (chave `/api/v1/charts/analytics_totals`, `staleTime` de 5 min). `useRefetch.tsx` não lista essa rota nas dependências de faturas, pagamentos, recorrentes ou clientes (lista `totals_v2` e `chart_summary_v2`).

**Cenário:** registrar um pagamento e voltar ao Painel. "Precisa de ação" e "Recebido no mês" são invalidados e atualizam; "A receber", "Em atraso" e MRR continuam com o valor anterior por até 5 minutos. A mesma tela mostra números que não fecham entre si.

**Menor correção:** acrescentar `'/api/v1/charts/analytics_totals'` às dependências de `invoices`, `payments`, `recurring_invoices`, `clients` e `credits` em `src/common/hooks/useRefetch.tsx`. O arquivo está fora do escopo declarado do Opus; precisa de autorização do coordenador.

Troca de empresa não é afetada: `CompanySwitcher` recarrega a página.

### 4. BAIXA — Semântica de três indicadores merece texto mais exato

- **"Recebido em {mês}"** inclui pagamentos pendentes (status 1). A dica diz só "descontados estornos". Sugestão: acrescentar "inclui pendentes".
- **"Precisa de ação" × "Em atraso":** a lista usa o filtro `overdue`, que também pega faturas com apenas a parcela (`partial_due_date`) vencida, e mostra o saldo inteiro da fatura. O KPI considera só `due_date`. Uma fatura com parcela vencida e vencimento final futuro entra na lista com o saldo total e não entra no valor do KPI. Sugestão: nessas linhas, mostrar o valor da parcela ou rotular "parcela vencida".
- **"Maiores contratos":** ordena pelo valor nominal de cada emissão, misturando moedas e frequências. A descrição já declara isso, o que considero honesto o suficiente; o título e a lista numerada ainda sugerem ranking comparável. Sugestão: título "Maiores valores por emissão" e lista sem numeração.

### 5. BAIXA (risco não verificado em navegador) — Folha com `overflow: hidden` pode recortar menus

`allberto.css:497-506` (`.ab-sheet`). Menus posicionados dentro do conteúdo, como o do `Combobox` (`forms/Combobox.tsx:427,723`, `absolute z-10`), passam a ser cortados na borda da folha quando a página é curta. Antes o `main` não recortava.
Verificar numa tela curta com seletor no fim do formulário. Se confirmar: retirar o `overflow: hidden` e arredondar os filhos, ou aplicar o recorte só às bordas superiores.

### 6. BAIXA (risco não verificado em navegador) — Gaveta móvel permanece aberta ao navegar com alterações não salvas

`SidebarItem.tsx:44-52`: no caminho de proteção, `preventNavigation` abre o modal de confirmação e `onNavigate` (que fecha a gaveta) não é chamado. A gaveta é um diálogo modal com contenção de foco; o modal de confirmação abre por cima dela.
Menor correção: chamar `props.onNavigate?.()` antes de `preventNavigation`.

### 7. BAIXA — Lista móvel em cartões perde semântica de tabela

`allberto.css:1393+`: abaixo de 860 px, `table`, `tbody`, `tr` e `td` das listas de entidade mudam de `display`, e os rótulos vêm de `::before` com `data-label`. Em vários navegadores isso remove os papéis de tabela, e a exposição do conteúdo gerado é irregular. Todas as colunas, a seleção e as ações continuam presentes e operáveis, o que atende ao pedido. Fica como ponto para o teste com leitor de tela, sem pedido de mudança agora.

### 8. Informativo

- **Onboarding** dispara duas consultas de contagem a cada abertura do Painel, mesmo em contas estabelecidas. Custo pequeno; poderia ser desligado quando o MRR ou o número de faturas já prova que a conta não é nova.
- **Fuso:** "dias em atraso" e o mês corrente usam o relógio do navegador; o backend usa o fuso da empresa. Diverge só na virada do dia ou do mês, para quem está em fuso diferente.
- **Recorrentes ativas sem data de próximo envio** viriam primeiro na ordenação e poderiam ocupar a página de 50 sem acionar o aviso de lista parcial. Caso raro.

## Verificado sem achados

- **Shell:** todas as props de `Default` preservadas; salvar, cancelar, opções adicionais de salvar, `saveBtnAtom`, `navigationTopRight`, `topRight`, breadcrumbs, banners e o botão de licença continuam ligados aos mesmos handlers. A topbar é renderizada uma vez, então busca, atalho e notificações não duplicam.
- **Menu:** `useNavigation` intocado; a reorganização só reordena, respeita `visible` e manda módulos desconhecidos para "Mais". Item ativo distingue `/invoices` de `/recurring_invoices`. Links respeitam a proteção de alterações não salvas. Mini-sidebar e cores personalizadas mantidas.
- **Troca de empresa, tema, criação rápida, busca:** lógica inalterada; só apresentação e atributos de acessibilidade.
- **Cores:** mesmas chaves `$0…$25`. O texto do botão primário passou a branco fixo sobre `#545dff` (contraste calculado ≈ 4,8:1).
- **StatusTabs:** altera o mesmo `customFilter` pelo mesmo `setCustomFilterIfChanged`; preserva filtros de outros grupos; multisseleção feita no seletor continua valendo; o seletor ressincroniza quando o filtro muda; sem contagens; sem laço de atualização (a função compara antes de gravar).
- **Erros do Painel:** 403, 404/405 e falha genérica são distinguidos; resposta engolida pelo interceptor global vira erro, nunca lista vazia nem zero; repetição automática só para falha transitória. Mensagens sem caminho de API.
- **Ações do Painel:** só navegação para telas reais; "Avisar cliente" abre a tela de e-mail e exige `edit_invoice`. Nenhum envio ou cobrança parte do Painel.
- **i18n:** chaves `allberto_*` presentes em `pt_BR` e `en`, sem texto fixo no código.

## Diferenças em relação à proposta que permanecem

Declaradas pelo Opus e aceitáveis por falta de contrato de dados: recusas e validade de cartão, barra "recebido vs previsto", sparkline do MRR, participação nos maiores contratos, "Recentes" e contador de vencidas no menu, períodos 3/6/12 meses (mantido o seletor real). KPIs e métricas próprias nas listas de entidade seguem ausentes pelo mesmo motivo.

## Acabamentos do Astra anunciados depois do fechamento

O coordenador informou dois ajustes mínimos ainda por vir. Às 09:52 nenhum dos dois estava no checkout (última alteração em `src/` às 09:47), então **não foram revisados**:

- **Chip vazio do cabeçalho de Ações na lista móvel.** Hoje existe apenas `thead th:empty { display: none }` (`allberto.css:1425`), que não cobre um `th` com conteúdo invisível. Ao revisar: confirmar que a regra não esconde o cabeçalho de seleção nem os chips de ordenação.
- **Texto de atividade vazia.** `invoices/edit/components/Activities.tsx:100-101` ainda mostra `t('api_404')` quando a consulta responde 200 sem registros. Ao revisar: confirmar que o vazio usa uma chave existente (por exemplo `no_records_found`) e que o estado de erro continua separado.

Ambos são de apresentação e não alteram o veredito.

## Testes executados

`npx vitest run` nos arquivos `tests/unit/allberto-{entities-overview,shell,dashboard,dashboard-http,i18n}.test.ts` e `tests/unit/components`: **14 arquivos, 83 testes passaram**.

Os testes de regra do Painel usam respostas montadas à mão. Por isso conferi os formatos na fonte do backend em vez de confiar neles; os formatos batem.

## Limites

- Nenhuma tela foi renderizada: sem navegador, sem backend, sem dados reais. Achados 5, 6 e 7 dependem de confirmação visual.
- Não rodei suíte completa, `tsc`, build, lint nem E2E. O handoff do Opus informa `tsc` com saída 0; não repeti.
- Os contratos vêm de `v5-develop`/`v5-stable` públicos. A versão do servidor allberto não é conhecida; se for anterior a `analytics_totals`, três KPIs mostram "indisponível" por desenho.
- Não é auditoria WCAG nem medição de desempenho. Contrastes citados são cálculo, não medição em tela.
- A evidência visual e as medições do handoff do Opus não foram reproduzidas.
